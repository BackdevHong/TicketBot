const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  Partials,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ChannelType,
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const dotenv = require("dotenv");
const { registerCommands } = require("./deploy-commands"); 
const { PrismaClient } = require("@prisma/client");
const dayjs = require("dayjs");
const { createTranscript } = require("discord-html-transcripts");
const clientDB = new PrismaClient();

dotenv.config();

registerCommands(process.env.TOKEN, process.env.CLIENT_ID, process.env.GUILD_ID)

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const CHANNEL_BOT_DEFAULT_MAKE = process.env.BOT_DEFAULT_MAKE
const CHANNEL_BOT_HOSTING_MAKE = process.env.BOT_HOSTING_MAKE
const CHANNEL_BOT_DB_HOSTING_MAKE = process.env.BOT_DB_HOSTING_MAKE
const CHANNEL_BOT_HOSTING = process.env.BOT_HOSTING
const CHANNEL_SERVER_MAKE = process.env.SERVER_MAKE
const CHANNEL_TICKET_SAVE_LOG = process.env.TICKET_SAVE_LOG
const CHANNEL_TICKET_TRANS_LOG = process.env.TICKET_TRANS_LOG

client.on(Events.ClientReady, async (client) => {
  console.log("Client ready");
});

/**
 * 
 * @param {import("discord.js").Interaction} interaction 
 * @param {import('discord.js').Client} client 
 * @param {import('discord.js').User} user
 */
async function makeRoom(interaction, client, channelId, user) {
  const reply = await interaction.deferReply({ephemeral: true})
  const guild = client.guilds.cache.get(process.env.GUILD_ID)
  const category = guild.channels.cache.get(channelId)

  if (!category) {
    await interaction.editReply({content: `카테고리가 존재하지 않습니다. 오류가 났습니다.`, ephemeral: true})
  }
  await guild.channels.create({
    name: `${user.displayName}님의 티켓`,
    type: ChannelType.GuildText,
  }).then(async (channel) => {
    channel.setParent(category)
    clientDB.ticket.create({
      data: {
        type: interaction.values[0],
        userId: user.id,
        channelId: channel.id,
        createAt: new Date(),
        closed: false
      }
    }).then((data) => {
      const logEmbed = new EmbedBuilder()
        .setTitle("티켓 생성 안내")
        .setDescription("티켓이 생성되었습니다. 담당자분은 빠르게 확인해주시기 바랍니다.")
        .addFields({
          name: "타입",
          value: `${interaction.values[0]}`
        },
        {
          name: "상담자",
          value: `<@${user.id}>`
        },
        {
          name: "티켓ID",
          value: `${data.id}`
        },
        {
          name: "채널",
          value: `<#${data.channelId}>`
        },
        {
          name: "생성일자",
          value:`${dayjs(data.createAt).format('YYYY-MM-DD')}`
        })
      guild.channels.cache.get(CHANNEL_TICKET_SAVE_LOG).send({content: `<@&1164553234535419915>`, embeds: [logEmbed]})
    })
    channel.permissionOverwrites.set([
      {
        id: user.id,
        allow: [PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel]
      },
      {
        id: guild.roles.everyone,
        deny: [PermissionFlagsBits.ViewChannel]
      }
    ])
    let message;
    let officer;
    switch (interaction.values[0]) {
      case "봇 단건 외주 플랜":
        message = `1. 닉네임 : \n2. 제작하려는 봇의 이름 : \n3. 제작하려는 봇의 상세정보 : (상세히 적어주세요) \n4. 봇의 사용 목적 : (해킹, 범죄, 악용 가능성이 있는 목적은 받아들이지 않습니다.)`
        officer = "<@&1164553234535419915>"
        break;
      case "봇 호스팅 외주 플랜" :
        message = `1. 닉네임 : \n2. 제작하려는 봇의 이름 : \n3. 제작하려는 봇의 상세정보 : (상세히 적어주세요) \n4. 봇의 사용 목적 : (해킹, 범죄, 악용 가능성이 있는 목적은 받아들이지 않습니다.)`
        officer = "<@&1164553234535419915>"
        break;
      case "봇 호스팅 + DB 외주 플랜" :
        message = `1. 닉네임 : \n2. 제작하려는 봇의 이름 : \n3. 제작하려는 봇의 상세정보 : (상세히 적어주세요) \n4. 봇의 사용 목적 : (해킹, 범죄, 악용 가능성이 있는 목적은 받아들이지 않습니다.)`
        officer = "<@&1164553234535419915>"
        break;
      case "봇 호스팅 플랜" :
        message = `1. 닉네임 : \n2. 봇 파일 소유 여부 : (Y/N)`
        officer = "<@&1164553234535419915>"
        break;
      case "서버 제작 플랜" :
        message = `1. 닉네임 : \n2. 제작하고 싶은 서버의 타입: (일반/커뮤니티) \n3. 제작하고 싶은 서버에 목적: (게임, 커뮤니티 등 여러가지 가능 단, 범죄 목적은 사용 불가)`
        officer = "<@1166002153211568222>"
        break
    }
    const embed = new EmbedBuilder()
      .setTitle(`${interaction.values[0]} 주문 티켓`)
      .setDescription(`[${interaction.values[0]}]을 주문하기 위해 문의주셔서 감사합니다. 아래 양식을 적고 기다려주세요.`)
      .addFields({
        name: "양식",
        value: `${message}`
      })
      .setTimestamp()
    
    const button = new ButtonBuilder()
      .setCustomId('closed')
      .setLabel('삭제(제작자만 가능)')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🗑️')

    const row = new ActionRowBuilder()
      .addComponents(button)
    await channel.send({content: `<@${user.id}>, ${officer}`, embeds: [embed], components: [row]})
  })
  await interaction.editReply({content: `방이 생성되었습니다.`, ephemeral: true})

}

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isStringSelectMenu) {
    if (interaction.customId === "ticket") {
      const value = interaction.values[0]

      switch (value) {
        case "봇 단건 외주 플랜":
          await makeRoom(interaction, client, CHANNEL_BOT_DEFAULT_MAKE, interaction.user)
          break;
        case "봇 호스팅 외주 플랜" :
          await makeRoom(interaction, client, CHANNEL_BOT_HOSTING_MAKE, interaction.user)
          break;
        case "봇 호스팅 + DB 외주 플랜" :
          await makeRoom(interaction, client, CHANNEL_BOT_DB_HOSTING_MAKE, interaction.user)
          break;
        case "봇 호스팅 플랜" :
          await makeRoom(interaction, client, CHANNEL_BOT_HOSTING, interaction.user)
          break;
        case "서버 제작 플랜" :
          await makeRoom(interaction, client, CHANNEL_SERVER_MAKE, interaction.user)
          break
      }
    }
  }
  
  if (interaction.isButton()) {
    await interaction.deferReply({ephemeral: true})
    const guild = client.guilds.cache.get(process.env.GUILD_ID)
    if (interaction.customId === "closed") {
      const user = guild.members.cache.get(interaction.user.id)
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        await interaction.editReply({content: "권한이 없습니다."})
        return
      } else {
        await interaction.editReply({content: "티켓 보관 및 삭제 처리중입니다.."})
        const tdata = await clientDB.ticket.findFirst({
          where: {
            channelId: interaction.channel.id,
            userId: interaction.user.id
          }
        })
        const attachment = await createTranscript(interaction.channel)
        await clientDB.ticket.update({
          where: {
            id: tdata.id
          },
          data: {
            closed: true,
            closedAt: new Date()
          }
        })

        const transEmbed = new EmbedBuilder()
          .setTitle("티켓이 종료되었습니다.")
          .setDescription(`${tdata.id} - <@${tdata.userId}>`)
          .addFields({
            name: "타입",
            value: `${tdata.type}`
          })

        const Message = await guild.channels.cache.get(CHANNEL_TICKET_TRANS_LOG).send({
          embeds: [transEmbed],
          files: [attachment]
        })
        await interaction.channel.delete("상담 종료")
      }
    }
  }
  if (interaction.commandName === "티켓") {
    const embed = new EmbedBuilder()
      .setTitle("외주 상담 요청")
      .setDescription("외주 티켓을 생성하시려면 아래 선택 메뉴 중, 구매하려고 하는 플랜을 선택해주세요.")
      .addFields({
        name: "외주 종류",
        value: `외주는 5가지로 구분됩니다\n1. 봇 ( 단건 ) 외주 플랜 : 호스팅, DB를 제외하고, 봇 파일과 디스코드 초대 링크를 보내드립니다.\n2. 봇 ( 호스팅 ) 외주 플랜 : 봇을 만들고, 호스팅까지 진행하는 플랜입니다. ( 월정액 )\n3. 봇 ( 호스팅 + DB ) 외주 플랜 : 봇을 만들고, 호스팅과 DB 세팅까지 진행하는 플랜입니다. ( 월정액 )\n4. 봇 ( 호스팅 ) 플랜 :  봇을 만들지 않고, 호스팅만 제공하는 플랜입니다. ( 월정액 )\n5. 서버 제작 플랜 : 맞춤형으로 서버를 제작해드리는 플랜입니다. ( 봇 세팅은 추가금 3000원입니다. )`
      })

    const Component = new StringSelectMenuBuilder()
      .setCustomId('ticket')
      .setPlaceholder('구매 플랜을 결정해주세요!')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('봇 ( 단건 ) 외주 플랜')
          .setDescription('봇만 만들어드리는 외주 플랜입니다!')
          .setValue('봇 단건 외주 플랜'),
        new StringSelectMenuOptionBuilder()
          .setLabel('봇 ( 호스팅 ) 외주 플랜')
          .setDescription('봇을 만들고 호스팅을 제공해드리는 외주 플랜입니다!')
          .setValue('봇 호스팅 외주 플랜'),
        new StringSelectMenuOptionBuilder()
          .setLabel('봇 (호스팅, DB) 외주 플랜')
          .setDescription('봇을 만들고 호스팅을 제공해드리는 외주 플랜입니다! ( DB도 함께 들어가있는 플랜입니다. ) ( 월정액 )')
          .setValue('봇 호스팅 + DB 외주 플랜'),
        new StringSelectMenuOptionBuilder()
          .setLabel('봇 호스팅 플랜')
          .setDescription('봇을 만들지 않고, 호스팅과 봇 파일을 받아 돌려드립니다. ( 서버 구성 플랜입니다. ) ( 월정액 )')
          .setValue('봇 호스팅 플랜'),
        new StringSelectMenuOptionBuilder()
          .setLabel('서버 제작 플랜')
          .setDescription('맞춤형 서버를 제작해드리는 플랜입니다. ( *봇 외주가 아닙니다. )')
          .setValue('서버 제작 플랜')
      )

    const row = new ActionRowBuilder()
        .addComponents(Component)

    interaction.reply({embeds: [embed], components: [row]})
  }
})

client.login(process.env.TOKEN);
