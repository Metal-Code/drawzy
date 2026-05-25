import OpenAI from 'openai'

const openrouter = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY
})

const fallbackWords = {
    easy: [
        'cat', 'dog', 'house', 'tree', 'car', 'sun', 'fish', 'bird',
        'apple', 'ball', 'book', 'chair', 'clock', 'cloud', 'cup',
        'door', 'egg', 'flag', 'flower', 'hat',
        // 30 New Easy Words (Simple shapes, easy to recognize)
        'boat', 'moon', 'star', 'cake', 'milk', 'shoe', 'key', 'frog',
        'duck', 'banana', 'pencil', 'pizza', 'ring', 'bone', 'leaf',
        'sock', 'shirt', 'table', 'window', 'spoon', 'knife', 'fork',
        'glasses', 'heart', 'smile', 'spider', 'snake', 'snow', 'fire', 'bed'
    ],
    medium: [
        'elephant', 'guitar', 'volcano', 'sandwich', 'bicycle', 'tornado',
        'telescope', 'umbrella', 'rocket', 'penguin', 'waterfall', 'castle',
        'submarine', 'cactus', 'rainbow', 'helicopter', 'igloo', 'compass',
        'lantern', 'anchor',
        // 30 New Medium Words (More detail, specific objects or simple scenes)
        'astronaut', 'dinosaur', 'pirate', 'mermaid', 'skeleton', 'treasure',
        'hamburger', 'pineapple', 'popcorn', 'spaghetti', 'backpack', 'keyboard',
        'headset', 'microscope', 'windmill', 'lighthouse', 'scarecrow', 'snowman',
        'caterpillar', 'butterfly', 'jellyfish', 'octopus', 'kangaroo', 'giraffe',
        'suitcase', 'toothbrush', 'hot air balloon', 'roller coaster', 'campfire', 'statue'
    ],
    hard: [
        'jealousy', 'democracy', 'gravity', 'evolution', 'karma',
        'procrastination', 'déjà vu', 'inflation', 'nightmare', 'echo',
        'silence', 'freedom', 'ambition', 'nostalgia', 'paradox',
        'revolution', 'chaos', 'illusion', 'destiny', 'temptation',
        // 30 New Hard Words (Abstract concepts, metaphors, or complex scenarios)
        'time travel', 'parallel universe', 'extinction', 'global warming', 'hypnotize',
        'superhero', 'black hole', 'teleport', 'nightmare', 'déjà vu', // keeping your originals
        'blueprint', 'symphony', 'mirage', 'geometry', 'allergy',
        'internet', 'artificial intelligence', 'quicksand', 'eclipse', 'gossip',
        'greed', 'victory', 'betrayal', 'confetti', 'dilemma',
        'deforestation', 'cryptid', 'glitch', 'gravity', 'wisdom', 'curse'
    ]
}

const difficultyPrompts = {
    easy: `Generate ${0} unique EASY words for a Pictionary-style drawing game.
        Rules:
        - Simple, everyday physical objects that anyone can draw and guess — animals, food, household items, nature.
        - Words a child could understand and draw.
        - No abstract concepts.
        - No repeated words.
        - Return only a JSON array of strings, nothing else. No explanation, no markdown, no backticks.`,

    medium: `Generate ${0} unique MEDIUM difficulty words for a Pictionary-style drawing game.
        Rules:
        - More specific objects, places, actions, or simple concepts that are challenging but still drawable.
        - Can include professions, sports, vehicles, landmarks, activities.
        - Slightly abstract is okay if it can still be expressed visually.
        - No repeated words.
        - Return only a JSON array of strings, nothing else. No explanation, no markdown, no backticks.`,

    hard: `Generate ${0} unique HARD words for a Pictionary-style drawing game.
        Rules:
        - Abstract concepts, emotions, ideas, or complex scenarios that are very challenging to draw.
        - Can include things like feelings, philosophical concepts, paradoxes, or complex actions.
        - Should require creative thinking to draw and guess.
        - No repeated words.
        - Return only a JSON array of strings, nothing else. No explanation, no markdown, no backticks.`
}

const chunkIntoThree = (words) => {
    const chunks = []
    for (let i = 0; i < words.length; i += 3) {
        chunks.push(words.slice(i, i + 3))
    }
    return chunks
}

// const chunkIntoSets = (easy, medium, hard) => {
//     const sets = []
//     for (let i = 0; i < easy.length; i++) {
//         sets.push([easy[i], medium[i], hard[i]])
//     }
//     return sets
// }

const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]
    }
    return array
}

const getFallbackWords = (totalSets, difficulty) => {
    const source = [...fallbackWords[difficulty]]
    const needed = totalSets * 3
    while (source.length < needed) {
        source.push(...fallbackWords[difficulty])
    }
    return chunkIntoThree(shuffleArray(source).slice(0, needed))
}

const fetchWordsForDifficulty = async (difficulty, count) => {
    const prompt = difficultyPrompts[difficulty].replace('${0}', count)

    const response = await openrouter.chat.completions.create({
        model: 'openrouter/auto',
        messages: [{ role: 'user', content: prompt }]
    })

    const content = response.choices[0].message.content.trim()
    const words = JSON.parse(content)

    if (!Array.isArray(words) || words.length < count) {
        throw new Error(`Invalid response for ${difficulty} words`)
    }

    return words
}

export const generateWordsForGame = async (totalRounds, totalPlayers, difficulty = 'medium') => {
    const totalSets = totalRounds * totalPlayers

    try {
        const words = await fetchWordsForDifficulty(difficulty, totalSets * 3)
        return chunkIntoThree(words)

    } catch (error) {
        console.error('Word generation failed, using fallback:', error.message)
        return getFallbackWords(totalSets, difficulty)
    }
}