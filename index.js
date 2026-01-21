require("dotenv").config();
const { 
  Client, GatewayIntentBits, Partials, 
  ActionRowBuilder, ButtonBuilder, ButtonStyle, 
  StringSelectMenuBuilder, PermissionsBitField, 
  ChannelType, EmbedBuilder 
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Channel]
});

// CONFIGURAÇÕES
const OWNER_ROLE_ID = process.env.OWNER_ROLE_ID;
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID;
const CANAL_MENU_ID = process.env.CHANNEL_MENU_ID;

const PIX_CHAVE = process.env.PIX_CHAVE;
const PIX_NOME = process.env.PIX_NOME;
const PIX_BANCO = process.env.PIX_BANCO;
const PIX_AVISO = process.env.PIX_AVISO;

// COMPONENTES
const statusRow = new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId("status_aguardando").setLabel("Aguardando").setEmoji("🟡").setStyle(ButtonStyle.Secondary),
  new ButtonBuilder().setCustomId("status_pago").setLabel("Pago").setEmoji("🟢").setStyle(ButtonStyle.Success),
  new ButtonBuilder().setCustomId("status_entrega").setLabel("Entrega").setEmoji("🔵").setStyle(ButtonStyle.Primary),
  new ButtonBuilder().setCustomId("status_concluido").setLabel("Concluído").setEmoji("✅").setStyle(ButtonStyle.Success)
);

const pagamentoRow = new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId("enviar_pix").setLabel("PIX").setStyle(ButtonStyle.Success),
  new ButtonBuilder().setCustomId("enviar_comprovante").setLabel("Enviar Comprovante").setStyle(ButtonStyle.Primary)
);

const rowClose = new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId("fechar_ticket").setLabel("Fechar Ticket").setStyle(ButtonStyle.Danger)
);

// MENU PRINCIPAL
const menu = new StringSelectMenuBuilder()
  .setCustomId("menu_vendas")
  .setPlaceholder("🛒 Selecione o produto")
  .addOptions([
    { label: "Moedas Digitais", value: "moedas_digitais", emoji: "💎" },
    { label: "Jogos", value: "jogos", emoji: "🎮" },
    { label: "Fuja Do Tsunami Para Brainrots", value: "brainrots", emoji: "🧠" },
    { label: "Contas de Steam", value: "steam", emoji: "🔥" },
    { label: "Contas BF", value: "bf", emoji: "🎯" }
  ]);

const rowMenu = new ActionRowBuilder().addComponents(menu);

// MENU SECUNDÁRIO DE MOEDAS DIGITAIS
const menuMoedas = new StringSelectMenuBuilder()
  .setCustomId("menu_moedas")
  .setPlaceholder("💎 Escolha a moeda digital")
  .addOptions([
    { label: "Robux", value: "robux", emoji: "💰" },
    { label: "V-Bucks", value: "vbucks", emoji: "🪙" },
    { label: "Diamantes FF", value: "diamantes_ff", emoji: "🔹" },
    { label: "COD Points", value: "cod_points", emoji: "🎯" },
    { label: "VP", value: "vp", emoji: "💠" }
  ]);

const rowMenuMoedas = new ActionRowBuilder().addComponents(menuMoedas);

// Mensagem inicial do menu com embed bonito
client.on("ready", async () => {
  console.log(`Logado como ${client.user.tag}!`);

  const canal = await client.channels.fetch(CANAL_MENU_ID);

  const menuEmbed = new EmbedBuilder()
    .setTitle("🛒 Bem-vindo à Elite Shop!")
    .setDescription("Escolha o produto que deseja comprar no menu abaixo.\n\n💡 Após criar o ticket, envie o comprovante se for pagamento via PIX.")
    .setColor(0x00ff99)
    .setThumbnail("https://i.imgur.com/6KwWoZb.jpeg")
    .setFooter({ text: "Atendimento exclusivo via tickets" });

  await canal.send({ embeds: [menuEmbed], components: [rowMenu] });
  console.log("Menu de vendas enviado!");
});

// Função auxiliar para criar tickets
async function criarTicket(interaction, nome) {
  const channel = await interaction.guild.channels.create({
    name: `🛒-${nome}-${interaction.user.username}`,
    type: ChannelType.GuildText,
    parent: TICKET_CATEGORY_ID,
    permissionOverwrites: [
      { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
      { id: OWNER_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
      { id: STAFF_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
    ]
  });

  const ticketEmbed = new EmbedBuilder()
    .setTitle("📦 Status do Pedido")
    .setDescription("🟡 Aguardando Pagamento")
    .setColor(0xffcc00);

  await channel.send({ embeds: [ticketEmbed], components: [statusRow, pagamentoRow, rowClose] });
}

// EVENTO DE INTERAÇÃO
client.on("interactionCreate", async (interaction) => {

  // BOTÕES
  if (interaction.isButton()) {

    // Apenas Dono ou Staff podem mexer
    if (
      ["fechar_ticket","enviar_pix","status_aguardando","status_pago","status_entrega","status_concluido"]
      .includes(interaction.customId) &&
      !interaction.member.roles.cache.has(OWNER_ROLE_ID) &&
      !interaction.member.roles.cache.has(STAFF_ROLE_ID)
    ) {
      return interaction.reply({ content: "❌ Apenas Dono ou Staff podem mexer nos tickets.", ephemeral: true });
    }

    // Enviar PIX
    if (interaction.customId === "enviar_pix") {
      await interaction.deferReply({ ephemeral: true });
      await interaction.channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("💳 Pagamento via PIX")
            .addFields(
              { name: "Chave", value: `\`${PIX_CHAVE}\`` },
              { name: "Nome", value: PIX_NOME },
              { name: "Banco", value: PIX_BANCO }
            )
            .setDescription(PIX_AVISO)
            .setColor(0x00ff99)
        ]
      });
      await interaction.editReply({ content: "PIX enviado." });
    }

    // Comprovante
    if (interaction.customId === "enviar_comprovante") {
      return interaction.reply({
        content: "📸 Envie a **imagem ou PDF do comprovante** aqui no ticket.",
        ephemeral: true
      });
    }

    // Fechar ticket
    if (interaction.customId === "fechar_ticket") {
      await interaction.reply({ content: "🔒 Fechando em 10s..." });
      setTimeout(() => interaction.channel.delete(), 10000);
    }

    // Alterar status
    if (["status_aguardando","status_pago","status_entrega","status_concluido"].includes(interaction.customId)) {
      const statusMap = {
        status_aguardando: { text: "🟡 Aguardando Pagamento", color: 0xffcc00 },
        status_pago: { text: "🟢 Pago", color: 0x00ff00 },
        status_entrega: { text: "🔵 Em Entrega", color: 0x0000ff },
        status_concluido: { text: "✅ Concluído", color: 0x00ff99 }
      };
      const status = statusMap[interaction.customId];
      await interaction.update({
        embeds: [
          new EmbedBuilder()
            .setTitle("📦 Status do Pedido")
            .setDescription(status.text)
            .setColor(status.color)
        ],
        components: [statusRow, pagamentoRow, rowClose]
      });
    }
  }

  // MENUS DE SELEÇÃO
  if (interaction.isStringSelectMenu()) {

    // MENU PRINCIPAL
    if (interaction.customId === "menu_vendas") {
      const produto = interaction.values[0];

      // Se for Moedas Digitais, envia o menu secundário
      if (produto === "moedas_digitais") {
        return interaction.reply({
          content: "💎 Você escolheu Moedas Digitais! Agora selecione a moeda que deseja:",
          components: [rowMenuMoedas],
          ephemeral: true
        });
      }

      // Outros produtos
      await criarTicket(interaction, produto);
      await interaction.reply({ content: `✅ Ticket criado para: ${produto}`, ephemeral: true });
    }

    // MENU SECUNDÁRIO DE MOEDAS DIGITAIS
    if (interaction.customId === "menu_moedas") {
      const moeda = interaction.values[0];
      await criarTicket(interaction, moeda);
      await interaction.reply({ content: `✅ Ticket criado para: ${moeda}`, ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);
