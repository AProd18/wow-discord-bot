import { Client, GatewayIntentBits, Collection, Events } from "discord.js";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import { getCharacterProfile, getCharacterAchievements } from "wow-api-sdk";
import "./server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const commandsPath = join(__dirname, "commands");

config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = (await import(`./commands/${file}`)).default;
  client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, (c) => {
  console.log(`Bot online as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "info_select") {
      const selected = interaction.values[0];
      if (selected === "pvp") {
        try {
          await interaction.deferUpdate();

          const embed = interaction.message.embeds[0];
          const name = embed.author?.name.split(" - ")[0];
          const regionRealm = embed.footer?.text;

          if (!name || !regionRealm) {
            throw new Error("Embed data missing");
          }

          const [realm, regionRaw] = regionRealm.replace(")", "").split(" (");
          const region = regionRaw.toLowerCase();

          const profile = await getCharacterProfile(region, realm, name);
          const achievements = await getCharacterAchievements(
            region,
            realm,
            name,
          );

          const gladiatorAchv = achievements.achievements.find((ach) =>
            ach.achievement.name.toLowerCase().includes("gladiator"),
          );

          const { EmbedBuilder } = await import("discord.js");
          const pvpEmbed = new EmbedBuilder()
            .setTitle(`${name} - PvP Stats`)
            .setColor(0x992d22)
            .addFields(
              {
                name: "Honor Level",
                value: `${profile.honor_level}`,
                inline: true,
              },
              {
                name: "Honorable Kills",
                value: `${profile.honorable_kills}`,
                inline: true,
              },
              {
                name: "Gladiator",
                value: gladiatorAchv
                  ? `${gladiatorAchv.achievement.name} (${new Date(
                      gladiatorAchv.completed_timestamp,
                    ).toLocaleDateString()})`
                  : "No Gladiator achievements",
              },
            )
            .setFooter({ text: `${realm} (${region})` });

          await interaction.editReply({
            content: "",
            embeds: [pvpEmbed],
            components: [],
          });
        } catch (err) {
          console.error(err);
          await interaction.editReply({
            content: "Failed to load PvP stats.",
            components: [],
          });
        }
      }
      return;
    }
  }

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "Error executing command!",
      ephemeral: true,
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
