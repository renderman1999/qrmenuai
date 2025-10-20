import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function analyzeDish(description: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a food safety expert. Analyze the dish description and extract:
          1. Allergens (gluten, dairy, nuts, shellfish, etc.)
          2. Ingredients list
          3. Dietary restrictions (vegetarian, vegan, gluten-free, etc.)
          4. Spice level (mild, medium, hot, very hot)
          
          Return a JSON object with this structure:
          {
            "allergens": ["allergen1", "allergen2"],
            "ingredients": ["ingredient1", "ingredient2"],
            "isVegetarian": boolean,
            "isVegan": boolean,
            "isGlutenFree": boolean,
            "isSpicy": boolean,
            "spiceLevel": "mild|medium|hot|very hot"
          }`
        },
        {
          role: "user",
          content: `Analyze this dish: "${description}"`
        }
      ],
      temperature: 0.1,
    })

    const analysis = JSON.parse(completion.choices[0].message.content || '{}')
    return analysis
  } catch (error) {
    console.error('OpenAI analysis error:', error)
    return {
      allergens: [],
      ingredients: [],
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      isSpicy: false,
      spiceLevel: 'mild'
    }
  }
}

export async function generateRecommendations(userPreferences: any, availableDishes: any[]) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a restaurant recommendation AI. Based on user preferences and available dishes, provide personalized recommendations.
          
          Consider:
          - Dietary restrictions (vegetarian, vegan, gluten-free, allergies)
          - Spice preferences
          - Price range
          - Popular dishes
          
          Return a JSON array of dish recommendations with reasoning.`
        },
        {
          role: "user",
          content: `User preferences: ${JSON.stringify(userPreferences)}
          Available dishes: ${JSON.stringify(availableDishes.map(d => ({ name: d.name, description: d.description, price: d.price })))}`
        }
      ],
      temperature: 0.3,
    })

    const recommendations = JSON.parse(completion.choices[0].message.content || '[]')
    return recommendations
  } catch (error) {
    console.error('OpenAI recommendations error:', error)
    return []
  }
}

export async function chatWithAI(message: string, context: any) {
  try {
    // Build context string with available dishes
    let contextString = ""
    let allDishes: any[] = []
    
    if (context.menu) {
      const menu = context.menu
      contextString += `Ristorante: ${menu.restaurant.name}\n`
      contextString += `Menu: ${menu.name}\n\n`
      contextString += "Piatti disponibili:\n"
      
      menu.categories.forEach((category: any) => {
        if (category.dishes && category.dishes.length > 0) {
          contextString += `\n${category.name}:\n`
          category.dishes.forEach((dish: any) => {
            contextString += `- ${dish.name} (€${dish.price})`
            if (dish.description) contextString += `: ${dish.description}`
            if (dish.isVegetarian) contextString += " [Vegetariano]"
            if (dish.isVegan) contextString += " [Vegano]"
            if (dish.isGlutenFree) contextString += " [Senza glutine]"
            if (dish.isSpicy) contextString += " [Piccante]"
            if (dish.allergens && dish.allergens.length > 0) {
              contextString += ` [Allergeni: ${dish.allergens.join(', ')}]`
            }
            contextString += "\n"
            
            // Collect all dishes for matching
            allDishes.push(dish)
          })
        }
      })
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Sei ChefBot, assistente AI per ristoranti. Rispondi in modo CONCISO e diretto.

CONTESTO DEL MENU:
${contextString}

REGOLE:
- Risposte MASSIMO 2-3 frasi
- Sii diretto e utile
- Per restrizioni dietetiche, suggerisci SOLO piatti con i tag corretti:
  * [Senza glutine] = senza glutine
  * [Vegetariano] = vegetariano  
  * [Vegano] = vegano
  * [Piccante] = piccante
- Includi prezzi quando rilevanti
- NON usare emoji nelle risposte
- Se nessun piatto corrisponde, dillo brevemente

ESEMPIO RISPOSTA CORRETTA:
"Perfetto! Ti consiglio la Pasta al Pomodoro (€12) e l'Insalata Mista (€8). Entrambe sono vegetariane."

ESEMPIO RISPOSTA SBAGLIATA (troppo lunga):
"Grazie per la tua domanda sui piatti vegetariani. Sono felice di aiutarti a trovare le opzioni giuste per te. Nel nostro menu abbiamo diverse opzioni vegetariane che potrebbero interessarti..."
`
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
    })

    const response = completion.choices[0].message.content || "Mi dispiace, non sono riuscito a processare la tua richiesta."
    
    // Try to identify dishes mentioned in the response
    const mentionedDishes = identifyDishesInResponse(response, allDishes)
    
    return {
      response,
      mentionedDishes
    }
  } catch (error) {
    console.error('OpenAI chat error:', error)
    return {
      response: "Mi dispiace, sto avendo problemi tecnici. Riprova tra un momento.",
      mentionedDishes: []
    }
  }
}

function identifyDishesInResponse(response: string, allDishes: any[]): any[] {
  const mentionedDishes: any[] = []
  
  // More sophisticated matching
  allDishes.forEach(dish => {
    const dishName = dish.name.toLowerCase()
    const responseLower = response.toLowerCase()
    
    // Check for exact name match
    if (responseLower.includes(dishName)) {
      mentionedDishes.push(dish)
      return
    }
    
    // Check for partial matches (useful for dishes with long names)
    const dishWords = dishName.split(' ')
    const matchedWords = dishWords.filter((word: string) => 
      word.length > 3 && responseLower.includes(word)
    )
    
    // If more than 50% of words match, consider it mentioned
    if (matchedWords.length > 0 && (matchedWords.length / dishWords.length) >= 0.5) {
      mentionedDishes.push(dish)
    }
  })
  
  return mentionedDishes
}
