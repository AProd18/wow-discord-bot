import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import {
  getCharacterProfile,
  getCharacterPvpSummary,
  getCharacterMounts,
  getCharacterSpecializations,
} from "wow-api-sdk";

async function fetchCharacter(region, realm, name) {
  const realmSlug = realm.toLowerCase().replace(/ /g, "-");

  const profile = await getCharacterProfile(region, realmSlug, name);
  const pvp = await getCharacterPvpSummary(region, realmSlug, name);
  const mounts = await getCharacterMounts(region, realmSlug, name);
  const specs = await getCharacterSpecializations(region, realmSlug, name);

  return {
    name: profile.name,
    realm,
    region,
    ilvl: profile.equipped_item_level,
    achievementPoints: profile.achievement_points,
    honorLevel: pvp.honor_level,
    honorableKills: pvp.honorable_kills,
    mounts: mounts.mounts.length,
    spec: specs.active_specialization.name,
  };
}

function formatComparison(statName, value1, value2) {
  if (typeof value1 === "number" && typeof value2 === "number") {
    if (value1 > value2) return [`${value1} 🟢`, `${value2}`];
    if (value2 > value1) return [`${value1}`, `${value2} 🟢`];
  }
  return [String(value1), String(value2)];
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

      const [ilvl1, ilvl2] = formatComparison("ilvl", char1.ilvl, char2.ilvl);
      const [ach1, ach2] = formatComparison(
        "achievements",
        char1.achievementPoints,
        char2.achievementPoints,
      );
      const [honor1, honor2] = formatComparison(
        "honor",
        char1.honorLevel,
        char2.honorLevel,
      );
      const [kills1, kills2] = formatComparison(
        "kills",
        char1.honorableKills,
        char2.honorableKills,
      );
      const [mounts1, mounts2] = formatComparison(
        "mounts",
        char1.mounts,
        char2.mounts,
      );

      const embed = new EmbedBuilder()
        .setTitle("⚔️ Character Comparison")
        .setDescription(
          `**${char1.name}** (${realm1} - ${region1})\nvs\n**${char2.name}** (${realm2} - ${region2})`,
        )
        .addFields(
          {
            name: "Stat",
            value:
              "Item Level\nAchievement Points\nHonor Level\nHonorable Kills\nMounts\nActive Spec",
            inline: true,
          },
          {
            name: char1.name,
            value: `${ilvl1}\n${ach1}\n${honor1}\n${kills1}\n${mounts1}\n${char1.spec}`,
            inline: true,
          },
          {
            name: char2.name,
            value: `${ilvl2}\n${ach2}\n${honor2}\n${kills2}\n${mounts2}\n${char2.spec}`,
            inline: true,
          },
        )
        .setColor(0x992d22);

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply(
        "❌ Failed to fetch one or both characters. Please check the input.",
      );
    }
  },
};
