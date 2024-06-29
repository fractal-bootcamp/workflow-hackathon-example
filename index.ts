import Instructor from "@instructor-ai/instructor";
import OpenAI from "openai";
import { z } from "zod";
import readline from "readline";

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined,
});

const client = Instructor({
  client: oai,
  mode: "TOOLS",
});

export const promptWithSchema = async (
  prompt: string,
  schema: z.ZodObject<any>
) => {
  const response = await client.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-3.5-turbo",
    response_model: {
      schema: schema,
      name: "User",
    },
  });
  return response;
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("What's the name of your DND Character ? ", function (givenName) {
  rl.question(
    "Anthing you'd like us to know about your character ? ",
    function (givenInfo) {
      rl.question(
        "What kind of monster would you like your character to fight ? ",
        async function (givenMonster) {
          // Use Instructor to generate a high level schema for the DND Character
          const dndCharacterSchema = z.object({
            name: z.string(),
            class: z.string(),
            level: z.number(),
            race: z.string(),
            alignment: z.string(),
            strength: z.number(),
            dexterity: z.number(),
            constitution: z.number(),
            intelligence: z.number(),
            wisdom: z.number(),
            charisma: z.number(),
          });

          const dndMonsterSchema = z.object({
            name: z.string(),
            level: z.number(),
            strength: z.number(),
            dexterity: z.number(),
            constitution: z.number(),
            intelligence: z.number(),
            wisdom: z.number(),
            charisma: z.number(),
          });

          const fightSequenceSchema = z.object({
            // character: dndCharacterSchema,
            // monster: dndMonsterSchema,
            fightSequence: z
              .array(
                z
                  .string()
                  .describe(
                    "A single action scene that the character and monster take to fight each other"
                  )
              )
              .describe(
                "The detailed sequence of actions that the character and monster take to fight each other"
              ),
            winner: z.string().describe("The winner of the fight"),
          }).describe("A detailed overview of the fight sequence with the attack highlights and the winner of the fight")

          const character = await promptWithSchema(
            `Generate a basic DND character with high level stats for ${givenName}. Feel free to be creative or use made up characters if this is more fun.`,
            dndCharacterSchema
          );
          const monster = await promptWithSchema(
            `Generate a basic DND monster with high level stats for ${givenMonster}. Feel free to be creative or use made up characters if this is more fun.`,
            dndMonsterSchema
          );
          const fightSequence = await promptWithSchema(
            `Generate a fight sequence for ${character.name} vs ${monster.name} using real stats. Make it light and fun, but keep it realistic to the stats.`,
            fightSequenceSchema
          );


          // FIGHT!
          console.log(`\n\n${character.name} vs ${monster.name}: FIGHT!\n`);

          fightSequence.fightSequence.map((action) => {
            console.log(action);
          });

          console.log(`The winner of the fight is ${fightSequence.winner}!`);
        }
      );
    }
  );
});