import util from "util";

const APIs = {
   aienhancer: { baseURL: "https://aienhancer.ai" },
   aladhan: { baseURL: "https://api.aladhan.com" },
   apocalypse: { baseURL: "https://api.apocalypse.web.id" },
   bagus: { baseURL: "https://api.baguss.xyz" },
   chatgot: { baseURL: "https://api.chatgot.io" },
   cuki: { baseURL: "https://api.cuki.biz.id" },
   deline: { baseURL: "https://api.deline.web.id" },
   denay: { baseURL: "https://api.denayrestapi.xyz" },
   doreso: { baseURL: "https://api.doreso.com" },
   elrayy: { baseURL: "https://api.elrayyxml.web.id" },
   ezremove: { baseURL: "https://api.ezremove.ai" },
   faa: { baseURL: "https://api-faa.my.id" },
   frankfurter: { baseURL: "https://api.frankfurter.app" },
   github: { baseURL: "https://api.github.com" },
   harz: { baseURL: "https://api.harzrestapi.web.id" },
   jikan: { baseURL: "https://api.jikan.moe" },
   kayzz: { baseURL: "https://kayzzidgf.my.id" },
   memegen: { baseURL: "https://api.memegen.link" },
   nexray: { baseURL: "https://api.nexray.web.id" },
   oota: { baseURL: "https://api.ootaizumi.web.id" },
   ryzumi: { baseURL: "https://api.ryzumi.net" },
   siputzx: { baseURL: "https://api.siputzx.my.id" },
   skole: { baseURL: "https://skoleapi-py.midgardai.io" },
   termai: { baseURL: "https://api.termai.cc" },
   waifupics: { baseURL: "https://api.waifu.pics" },
   webpilot: { baseURL: "https://api.webpilotai.com" },
   yp: { baseURL: "https://api.yupra.my.id" },
   zell: { baseURL: "https://zellapi.autos" },
   znx: { baseURL: "https://api.zenitsu.web.id" },
};

export function createUrl(apiNameOrURL, endpoint, params = {}, apiKeyParamName) {
   try {
      const api = APIs[apiNameOrURL];
      let baseURL;

      if (api) {
         baseURL = api.baseURL;
      } else {
         try {
            const url = new URL(apiNameOrURL);
            baseURL = url.origin;
         } catch {
            return null;
         }
      }

      const queryParams = new URLSearchParams(params);
      if (apiKeyParamName && api && api.APIKey) {
         queryParams.set(apiKeyParamName, api.APIKey);
      }

      const apiUrl = new URL(endpoint, baseURL);
      apiUrl.search = queryParams.toString();

      return apiUrl.toString();
   } catch (error) {
      console.error(`Error creating URL: ${util.format(error)}`);
      return null;
   }
}

export function listUrl() {
   return APIs;
}