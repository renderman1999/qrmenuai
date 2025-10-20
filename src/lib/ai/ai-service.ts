import OpenAI from 'openai'

// Configurazione AI
interface AIConfig {
  provider: 'openai' | 'deepseek'
  openaiApiKey: string
  deepseekApiKey: string
  isEnabled: boolean
}

// Inizializza client OpenAI per OpenAI
const createOpenAIClient = (apiKey: string) => {
  return new OpenAI({
    apiKey: apiKey
  })
}

// Inizializza client OpenAI per DeepSeek (compatibile)
const createDeepSeekClient = (apiKey: string) => {
  return new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.deepseek.com/v1'
  })
}

// Carica configurazione AI
async function loadAIConfig(): Promise<AIConfig> {
  try {
    // Carica dal database tramite API
    const response = await fetch('/api/admin/ai-config', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      return data.config
    }
  } catch (error) {
    console.log('Error loading AI config from database:', error)
  }

  // Fallback alle variabili ambiente solo se non siamo in un contesto server
  if (typeof window === 'undefined') {
    return {
      provider: (process.env.AI_PROVIDER as 'openai' | 'deepseek') || 'openai',
      openaiApiKey: process.env.OPENAI_API_KEY || '',
      deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
      isEnabled: true
    }
  }

  // Fallback per client-side
  return {
    provider: 'openai',
    openaiApiKey: '',
    deepseekApiKey: '',
    isEnabled: true
  }
}

// Ottieni client AI basato sulla configurazione
async function getAIClient() {
  const config = await loadAIConfig()
  
  if (!config.isEnabled) {
    throw new Error('AI service is disabled')
  }

  if (config.provider === 'deepseek' && config.deepseekApiKey) {
    return createDeepSeekClient(config.deepseekApiKey)
  } else if (config.provider === 'openai' && config.openaiApiKey) {
    return createOpenAIClient(config.openaiApiKey)
  } else {
    throw new Error('No valid AI provider configured')
  }
}

// Ottieni modello basato sul provider
async function getAIModel(): Promise<string> {
  const config = await loadAIConfig()
  
  if (config.provider === 'deepseek') {
    return 'deepseek-chat'
  } else {
    return 'gpt-4'
  }
}

// Analizza piatto con AI
export async function analyzeDish(description: string) {
  try {
    const client = await getAIClient()
    const model = await getAIModel()

    const completion = await client.chat.completions.create({
      model: model,
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
    console.error('AI analysis error:', error)
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

// Genera raccomandazioni personalizzate
export async function generateRecommendations(userPreferences: any, availableDishes: any[]) {
  try {
    const client = await getAIClient()
    const model = await getAIModel()

    const completion = await client.chat.completions.create({
      model: model,
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
    console.error('AI recommendations error:', error)
    return []
  }
}

// Chat con AI
export async function chatWithAI(message: string, context: any) {
  try {
    const client = await getAIClient()
    const model = await getAIModel()

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

    const completion = await client.chat.completions.create({
      model: model,
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
    console.error('AI chat error:', error)
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

// Ottieni informazioni sul provider attivo
export async function getAIProviderInfo() {
  try {
    const config = await loadAIConfig()
    return {
      provider: config.provider,
      isEnabled: config.isEnabled,
      model: config.provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4'
    }
  } catch (error) {
    return {
      provider: 'openai',
      isEnabled: false,
      model: 'gpt-4'
    }
  }
}
