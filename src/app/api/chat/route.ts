import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: Request) {
  const { message } = await req.json();
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content: JSON.stringify({
            prompts: [
              {
                user_query: "How do I start a garden?",
                response: [
                  "Do plants have secret gardening tips?",
                  "Can seeds gossip about soil quality?",
                  "Do flowers ever argue about which one’s the brightest?"
                ]
              },
              {
                user_query: "What's the best exercise?",
                response: [
                  "Do weights wish they could lift us?",
                  "Do treadmills dream of becoming roller coasters?",
                  "Can yoga mats get tired of being stretched?"
                ]
              },
              {
                user_query: "How do I learn a new language?",
                response: [
                  "Do languages compete for the most confusing?",
                  "Do dictionaries get jealous of each other?",
                  "Can words have secret meanings they don’t tell us?"
                ]
              },
              {
                user_query: "What's the weather like?",
                response: [
                  "Do clouds ever get bored of floating?",
                  "Does the weather wish it could be more dramatic?",
                  "Can raindrops gossip about their adventures?"
                ]
              },
              {
                user_query: "How do I make friends?",
                response: [
                  "Do friendships come with a user manual?",
                  "Can friends compete in a popularity contest?",
                  "Do people ever swap friends like trading cards?"
                ]
              },
              {
                user_query: "Tell me a joke.",
                response: [
                  "Do jokes ever get tired of being repeated?",
                  "Can jokes have existential crises?",
                  "Do punchlines dream of being punchy?"
                ]
              },
              {
                user_query: "How do I cook a steak?",
                response: [
                  "Do steaks have favorite seasoning combos?",
                  "Can steaks feel the sizzle in their bones?",
                  "Do steaks ever wish they could be vegan?"
                ]
              },
              {
                user_query: "What’s the latest news?",
                response: [
                  "Do news stories get tired of the spotlight?",
                  "Can headlines feel like they’re just recycled?",
                  "Do journalists ever gossip about the stories they cover?"
                ]
              },
              {
                user_query: "How do I organize my closet?",
                response: [
                  "Do clothes have a secret desire to be worn more often?",
                  "Can hangers get tired of holding stuff?",
                  "Do shoes ever dream of being in the spotlight?"
                ]
              },
              {
                user_query: "What’s your favorite food?",
                response: [
                  "Do foods ever get jealous of each other?",
                  "Can pizza feel insecure next to sushi?",
                  "Does my favorite food wish it could be a dessert?"
                ]
              },
              {
                user_query: "How do I make a good impression?",
                response: [
                  "Do impressions have a secret formula?",
                  "Can people compete in a ‘best first impression’ contest?",
                  "Do first impressions ever feel like a high-pressure game?"
                ]
              },
              {
                user_query: "How do I fix a leaky faucet?",
                response: [
                  "Do faucets ever get tired of dripping?",
                  "Can leaks wish they could stop being leaks?",
                  "Do plumbers have secret tricks for stubborn faucets?"
                ]
              },
              {
                user_query: "What's the meaning of a dream?",
                response: [
                  "Do dreams have a secret codebook?",
                  "Can dreams whisper their own secrets?",
                  "Do dream symbols have rivalries with each other?"
                ]
              },
              {
                user_query: "How do I improve my posture?",
                response: [
                  "Do backs ever wish they could take a vacation?",
                  "Can good posture be a competitive sport?",
                  "Do chairs get tired of holding us up?"
                ]
              },
              {
                user_query: "What's the best way to study?",
                response: [
                  "Do study methods have a popularity contest?",
                  "Can textbooks feel abandoned by students?",
                  "Do study techniques ever wish for a makeover?"
                ]
              }
            ]
          })
        },
        {
          role: "user",
          content: message,
        }
      ],
      model: "mixtral-8x7b-32768",
    });

    return NextResponse.json({ message: chatCompletion.choices[0]?.message?.content || "" });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
  }
}