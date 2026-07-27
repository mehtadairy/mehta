import { NextResponse } from 'next/server';
import { BUSINESS } from '@/lib/businessConfig';

export async function POST(request: Request) {
  try {
    const { name, category, ingredients, weight, shelfLife, storageInstructions } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Product Name is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const ingList = Array.isArray(ingredients) ? ingredients.join(', ') : ingredients || '';
    const cleanCategory = category ? category.replace('Sweets of ', '').replace('Tasty & ', '').replace('Chat-Patta ', '').toLowerCase() : 'item';

    if (apiKey) {
      // Prompt for Gemini API
      const prompt = `You are a professional copywriter for ${BUSINESS.name}, a premium Indian dairy and sweets brand since ${BUSINESS.foundedYear}.
Generate a structured marketing description and copy for a product with the following details:
- Product Name: ${name}
- Category: ${cleanCategory}
- Ingredients: ${ingList}
- Available Sizes/Weights: ${weight || 'N/A'}
- Shelf Life: ${shelfLife || '12'} days
- Storage Instructions: ${storageInstructions || 'Store in a cool and dry place.'}

Your response MUST be a valid JSON object matching the following structure exactly, with no additional text, markdown, or code block formatting (just raw JSON text):
{
  "description": "A premium, rich, mouth-watering marketing description (approx 50-80 words). Highlight the authenticity, traditional recipe, and premium ingredients.",
  "keyFeatures": [
    "Feature 1 highlighting taste or texture",
    "Feature 2 highlighting freshness or purity",
    "Feature 3 highlighting occasion/usage (e.g. perfect for festivals, gifting)"
  ],
  "whyChoose": "A compelling brand story statement (approx 30-50 words) about why customers should buy this specific item from ${BUSINESS.shortName} (heritage since ${BUSINESS.foundedYear}, pure ingredients, strict hygiene, unmatched quality)."
}`;

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        });

        if (response.ok) {
          const resJson = await response.json();
          const responseText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (responseText) {
            const parsed = JSON.parse(responseText.trim());
            return NextResponse.json({
              success: true,
              data: {
                description: parsed.description,
                keyFeatures: parsed.keyFeatures || [],
                whyChoose: parsed.whyChoose,
                ingredients: ingList,
                shelfLife: shelfLife,
                storageInstructions: storageInstructions
              }
            });
          }
        } else {
          console.warn("Gemini API returned an error:", await response.text());
        }
      } catch (geminiError) {
        console.error("Failed calling Gemini API:", geminiError);
        // Let it fall back to the rule-based generator
      }
    }

    // Rule-Based Fallback Generator
    const defaultDescriptions: { [key: string]: string } = {
      'milk-sweets': `Indulge in the rich, velvety texture of our signature ${name}. Crafted using pure condensed milk and traditional recipes passed down through generations, this sweet offers a delicate balance of sweetness and rich dairy goodness. Every bite is a celebration of authentic Indian heritage.`,
      'ghee-sweets': `Treat yourself to the heavenly taste of ${name}, prepared with the finest quality pure desi cow ghee. This melt-in-the-mouth classic is slow-cooked to golden perfection, capturing the warm, nutty aroma and rich texture that defines classic Indian mithai. Perfect for sharing and festive celebrations.`,
      'farsan': `Savor the crispy, crunchy goodness of ${name}, our premium savory blend. Made with clean sunflower oil and hand-mixed with special spices, it offers the perfect balance of salty, savory, and spicy notes. An irresistible companion for tea-time or mid-day cravings.`,
    };

    const fallbackDesc = defaultDescriptions[category] || 
      `Experience the authentic taste of ${name}, a premium delicacy from ${BUSINESS.shortName}. Prepared under strict hygienic conditions using carefully selected ingredients, this fresh and delicious ${cleanCategory} item brings the warmth of traditional Gujarati flavors straight to your home.`;

    const ingredientsString = ingList ? ` prepared using premium ${ingList}` : '';
    const keyFeatures = [
      `Made using premium quality fresh raw ingredients${ingredientsString}`,
      `Prepared under strict hygienic standards ensuring safety and purity`,
      `Traditional recipe preserving the authentic rich taste and texture`,
      `100% vegetarian product with zero artificial preservatives`
    ];

    const whyChoose = `${BUSINESS.shortName} has been a symbol of trust, purity, and heritage since ${BUSINESS.foundedYear}. We choose the finest local ingredients and combine them with strict quality controls to deliver premium sweets and dairy that taste exactly like home.`;

    return NextResponse.json({
      success: true,
      data: {
        description: fallbackDesc,
        keyFeatures,
        whyChoose,
        ingredients: ingList,
        shelfLife,
        storageInstructions
      }
    });

  } catch (error: any) {
    console.error('Error generating AI description:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
