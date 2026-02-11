import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import {
  getCharacterProfile,
  getCharacterAchievements,
  getCharacterMounts,
  getCharacterPvpSummary,
} from "wow-api-sdk";

async function fetchCharacter(region, realm, name) {
  const realmSlug = realm.toLowerCase().replace(/ /g, "-");
  const profile = await getCharacterProfile(region, realmSlug, name);
  const pvp = await getCharacterPvpSummary(region, realmSlug, name);
  const mounts = await getCharacterMounts(region, realmSlug, name);
  const achievements = await getCharacterAchievements(region, realmSlug, name);

  const gladiatorAchv = achievements.achievements.find((ach) =>
    ach.achievement.name.toLowerCase().includes("gladiator"),
  );

  return {
    name: profile.name,
    realm,
    region,
    ilvl: profile.equipped_item_level,
    achievementPoints: profile.achievement_points,
    honorLevel: pvp.honor_level,
    honorableKills: pvp.honorable_kills,
    mounts: mounts.mounts.length,
    gladiator: gladiatorAchv ? "Yes 🟢" : "No ❌",
  };
}

function formatComparison(val1, val2) {
  if (typeof val1 === "number" && typeof val2 === "number") {
    if (val1 > val2) return [`${val1} 🟢`, `${val2} ❌`];
    if (val2 > val1) return [`${val1} ❌`, `${val2} 🟢`];
  }
  return [val1, val2];
}

export default {
  data: new SlashCommandBuilder()
    .setName("wow-compare")
    .setDescription("Compare two WoW characters")
    .addStringOption((option) =>
      option
        .setName("name1")
        .setDescription("First character name")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("realm1")
        .setDescription("First character realm")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("region1")
        .setDescription("First character region (eu, us)")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("name2")
        .setDescription("Second character name")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("realm2")
        .setDescription("Second character realm")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("region2")
        .setDescription("Second character region (eu, us)")
        .setRequired(true),
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const name1 = interaction.options.getString("name1");
    const realm1 = interaction.options.getString("realm1");
    const region1 = interaction.options.getString("region1");

    const name2 = interaction.options.getString("name2");
    const realm2 = interaction.options.getString("realm2");
    const region2 = interaction.options.getString("region2");

    try {
      const char1 = await fetchCharacter(region1, realm1, name1);
      const char2 = await fetchCharacter(region2, realm2, name2);

      const [ilvl1, ilvl2] = formatComparison(char1.ilvl, char2.ilvl);
      const [ach1, ach2] = formatComparison(
        char1.achievementPoints,
        char2.achievementPoints,
      );
      const [honor1, honor2] = formatComparison(
        char1.honorLevel,
        char2.honorLevel,
      );
      const [kills1, kills2] = formatComparison(
        char1.honorableKills,
        char2.honorableKills,
      );
      const [mounts1, mounts2] = formatComparison(char1.mounts, char2.mounts);
      const [gladiator1, gladiator2] = [char1.gladiator, char2.gladiator];

      const embed = new EmbedBuilder()
        .setTitle("⚔️ WoW Character Comparison")
        .setDescription(
          `Comparing **${char1.name}** (${realm1} - ${region1}) vs **${char2.name}** (${realm2} - ${region2})`,
        )
        .setColor(0x992d22)
        .addFields(
          // Item & Achievement Section
          {
            name: "📊 Gear & Progress",
            value: "**Item Level**\n**Achievement Points**",
            inline: true,
          },
          {
            name: char1.name,
            value: `${ilvl1}\n${ach1}`,
            inline: true,
          },
          {
            name: char2.name,
            value: `${ilvl2}\n${ach2}`,
            inline: true,
          },

          // PvP Section
          {
            name: "⚔️ PvP Stats",
            value: "**Honor Level**\n**Honorable Kills**",
            inline: true,
          },
          {
            name: char1.name,
            value: `${honor1}\n${kills1}`,
            inline: true,
          },
          {
            name: char2.name,
            value: `${honor2}\n${kills2}`,
            inline: true,
          },

          // Misc Section
          {
            name: "🏆 Misc",
            value: "**Mounts Collected**\n**Gladiator**",
            inline: true,
          },
          {
            name: char1.name,
            value: `${mounts1}\n${gladiator1}`,
            inline: true,
          },
          {
            name: char2.name,
            value: `${mounts2}\n${gladiator2}`,
            inline: true,
          },
        );

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply(
        "❌ Failed to fetch one or both characters. Please check the input.",
      );
    }
  },
};
