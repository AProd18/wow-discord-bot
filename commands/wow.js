import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import {
  getCharacterProfile,
  getCharacterMedia,
  getCharacterSpecializations,
  getCharacterAchievements,
  getCharacterMounts,
  getCharacterPvpSummary,
} from "wow-api-sdk";

export default {
  data: new SlashCommandBuilder()
    .setName("wow")
    .setDescription("Get WoW character info")
    .addStringOption((option) =>
      option.setName("name").setDescription("Character name").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("realm").setDescription("Realm name").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("region")
        .setDescription("Region (e.g. eu, us)")
        .setRequired(true)
    ),

  async execute(interaction) {
    const name = interaction.options.getString("name");
    const realm = interaction.options.getString("realm");
    const realmSlug = realm.toLowerCase().replace(/ /g, "-");
    const region = interaction.options.getString("region");
    const pvp = await getCharacterPvpSummary(region, realmSlug, name);

    await interaction.deferReply();

    try {
      const profile = await getCharacterProfile(region, realmSlug, name);
      console.log(profile);
      const media = await getCharacterMedia(region, realmSlug, name);
      const avatar = media.assets.find((a) => a.key === "avatar")?.value;
      const inset = media.assets.find((a) => a.key === "inset")?.value;
      const mainRaw = media.assets.find((a) => a.key === "main-raw")?.value;
      const specs = await getCharacterSpecializations(region, realmSlug, name);
      const achievements = await getCharacterAchievements(
        region,
        realmSlug,
        name
      );
      const mounts = await getCharacterMounts(region, realmSlug, name);
      const gladiatorAchv = achievements.achievements.find((ach) =>
        ach.achievement.name.toLowerCase().includes("gladiator")
      );

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${profile.name} - ${profile.level} ${profile.character_class.name}`,
          iconURL: avatar,
        })
        .setThumbnail(mainRaw)
        .addFields(
          {
            name: "Item Level",
            value: `${profile.equipped_item_level}`,
            inline: true,
          },
          {
            name: "Specialization",
            value: specs.active_specialization.name,
            inline: true,
          },
          {
            name: "Mounts",
            value: `${mounts.mounts.length} collected`,
            inline: true,
          },
          {
            name: "Achievement Points",
            value: `${profile.achievement_points}`,
            inline: true,
          },
          {
            name: "Latest Achievement",
            value: achievements.achievements[0]?.achievement?.name ?? "None",
          },
          {
            name: "Gladiator",
            value: gladiatorAchv
              ? `${gladiatorAchv.achievement.name} (${new Date(
                  gladiatorAchv.completed_timestamp
                ).toLocaleDateString()})`
              : "No Gladiator achievements",
          },
          {
            name: "Honor Level",
            value: `${pvp.honor_level}`,
            inline: true,
          },
          {
            name: "Total Honorable Kills",
            value: `${pvp.honorable_kills}`,
            inline: true,
          }
        )
        .setColor(0x00ae86)
        .setFooter({ text: `${realm} (${region})` });

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply(
        "Failed to fetch character info. Please check name/realm/region."
      );
    }
  },
};
