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
          content: `Sei un assistente AI per un ristorante. Aiuta i clienti con domande sul menu, restrizioni dietetiche e raccomandazioni.

CONTESTO DEL MENU:
${contextString}

ISTRUZIONI:
- Rispondi sempre in italiano
- Sii amichevole e informativo
- Suggerisci piatti specifici dal menu quando appropriato
- Considera allergeni, preferenze dietetiche e budget
- Se non conosci qualcosa, dillo educatamente
- Usa emoji per rendere le risposte più accattivanti
- Fornisci prezzi quando rilevanti
- Suggerisci combinazioni di piatti quando appropriato

Se il cliente chiede di un piatto specifico o menziona un piatto dal menu, includi il nome del piatto nella risposta.`
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
  
  // Simple matching - look for dish names in the response
  allDishes.forEach(dish => {
    if (response.toLowerCase().includes(dish.name.toLowerCase())) {
      mentionedDishes.push(dish)
    }
  })
  
  return mentionedDishes
}
