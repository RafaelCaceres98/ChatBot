const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')
require("dotenv").config


const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
 const MockAdapter = require('@bot-whatsapp/database/mock')
// const MongoAdapter = require('@bot-whatsapp/database/mongo')
const { delay } = require('@whiskeysockets/baileys')
const path = require("path")
const fs = require("fs")
const chat = require("./chatGPT")
const { handlerAI } = require("./whisper")

const menuPath = path.join(__dirname, "mensajes", "menu.txt")
const menu = fs.readFileSync(menuPath, "utf8")

const pathConsultas = path.join(__dirname, "mensajes", "promptConsultas.txt")
const promptConsultas = fs.readFileSync(pathConsultas, "utf8")

// const flowSecundario = addKeyword(['2', 'siguiente']).addAnswer(['📄 Aquí tenemos el flujo secundario'])

// const flowDocs = addKeyword(['doc', 'documentacion', 'documentación']).addAnswer(
//     [
//         '📄 Aquí encontras las documentación recuerda que puedes mejorarla',
//         'https://bot-whatsapp.netlify.app/',
//         '\n*2* Para siguiente paso.',
//     ],
//     null,
//     null,
//     [flowSecundario]
// )

// const flowTuto = addKeyword(['tutorial', 'tuto']).addAnswer(
//     [
//         '🙌 Aquí encontras un ejemplo rapido',
//         'https://bot-whatsapp.netlify.app/docs/example/',
//         '\n*2* Para siguiente paso.',
//     ],
//     null,
//     null,
//     [flowSecundario]
// )

// const flowGracias = addKeyword(['gracias', 'grac']).addAnswer(
//     [
//         '🚀 Puedes aportar tu granito de arena a este proyecto',
//         '[*opencollective*] https://opencollective.com/bot-whatsapp',
//         '[*buymeacoffee*] https://www.buymeacoffee.com/leifermendez',
//         '[*patreon*] https://www.patreon.com/leifermendez',
//         '\n*2* Para siguiente paso.',
//     ],
//     null,
//     null,
//     [flowSecundario]
// )

// const flowDiscord = addKeyword(['discord']).addAnswer(
//     ['🤪 Únete al discord', 'https://link.codigoencasa.com/DISCORD', '\n*2* Para siguiente paso.'],
//     null,
//     null,
//     [flowSecundario]
// )

// const flowPrincipal = addKeyword(['hola', 'ole', 'alo'])
//     .addAnswer('🙌 Hola bienvenido Como estas')
    // .addAnswer(
    //     [
    //         'te comparto los siguientes links de interes sobre el proyecto',
    //         '👉 *doc* para ver la documentación',
    //         '👉 *gracias*  para ver la lista de videos',
    //         '👉 *discord* unirte al discord',
    //     ],
    //     null,
    //     null,
    //     [flowDocs, flowGracias, flowTuto, flowDiscord]
    // )

    const flowVoice = addKeyword(EVENTS.VOICE_NOTE).addAnswer("Esta es una nota de voz", null, async (ctx, ctxFn) => {
      const text = await handlerAI(ctx)
      const prompt = promptConsultas
      const consulta = text
      const answer = await chat(prompt, consulta)
      await ctxFn.flowDynamic(answer.content)
  })
  

    const flowMenuRest = addKeyword(EVENTS.ACTION)
    .addAnswer('🙌 Hola, este es el Menu', {
      media: "https://www.ujamaaresort.org/wp-content/uploads/2018/01/Ujamaa-restaurant-menu.pdf"
    })

    const flowReservar = addKeyword(EVENTS.ACTION)
    .addAnswer('🙌 Hola Este es el flow reservas')
    
   
const flowConsultas = addKeyword(EVENTS.ACTION)
.addAnswer('Este es el flow consultas')
.addAnswer("Hace tu consulta", { capture: true }, async (ctx, ctxFn) => {
    const prompt = promptConsultas
    const consulta = ctx.body
    const answer = await chat(prompt, consulta)
    await ctxFn.flowDynamic(answer.content)
})



const flowWelcome = addKeyword(EVENTS.WELCOME)
.addAnswer("Este es el flujo welcome", {
    delay: 100,
    // media:"https://www.purina.es/sites/default/files/styles/ttt_image_510/public/2024-02/sitesdefaultfilesstylessquare_medium_440x440public2022-07Miniature20Pinscher2.jpg?itok=tiIzIunR"
},
async(ctx, ctxFn) => {
  if(ctx.body.includes("Casas")){
    await ctxFn.flowDynamic("Escribiste casas ")
  }else{
    await ctxFn.flowDynamic("Escribiste otra cosa")
  } 
})


const menuFlow = addKeyword("MENU").addAnswer(
  menu,
 { capture: true },
 async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
 if (!["1", "2", "3","0"].includes(ctx.body)) {
 return fallBack(
 "Respuesta no válida, por favor selecciona una de las opciones."
 );
 }
 switch (ctx.body) {
 case "1":
 return  gotoFlow(flowMenuRest)
 case "2":
  return  gotoFlow(flowReservar)
 case "3":
  return  gotoFlow(flowConsultas)
 case "0":
 return await flowDynamic(
 "Saliendo... Puedes volver a acceder a este menú escribiendo '*Menu*'"
     );
   }
 }
);
 



const main = async () => {
    const adapterDB = new MockAdapter({
      dbUri: process.env.MONGO_DB_URI,
      dbName: "YoutubeTest"

    })
    const adapterFlow = createFlow([flowMenuRest,flowWelcome, flowReservar, flowConsultas, menuFlow,flowVoice])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()
