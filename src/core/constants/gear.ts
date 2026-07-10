// Données kit extraites verbatim de l'ancienne app (index.html v0.2.x).
// Ne pas éditer sans synchroniser avec l'ancien site tant qu'il est en ligne.

export interface GearLink { l: string; u: string }
export interface GearItem { id: string; name: string; note: string | null; price: string; links: GearLink[] }
export interface GearMode { indispensable: GearItem[]; recommande: GearItem[]; facultatif: GearItem[] }

export const GEAR: Record<'trek' | 'journee', GearMode> = {
  trek:{
    indispensable:[
      {id:'chaussures',name:'Chaussures de rando',note:'Gore-Tex si saison humide · Vibram recommandée',price:'80–180€',links:[]},
      {id:'batons',name:'Bâtons de rando',note:null,price:'30–90€',links:[]},
      {id:'sac50',name:'Sac à dos trek 50+10L',note:null,price:'60–150€',links:[{l:'MT900 · 50+10L',u:'https://www.decathlon.fr/p/sac-a-dos-de-trekking-homme-50-10l-mt900-symbium/_/R-p-342061'}]},
      {id:'frontale',name:'Frontale',note:null,price:'15–50€',links:[]},
      {id:'powerbank',name:'Power bank',note:null,price:'20–60€',links:[]},
      {id:'matelas',name:'Matelas gonflable',note:null,price:'40–90€',links:[{l:'MT500 Air',u:'https://www.decathlon.fr/p/matelas-gonflable-de-trekking-mt500-air-isolant-l-180-x-52-cm-1-personne/_/R-p-311475'}]},
      {id:'duvet',name:'Duvet / sac de couchage',note:'0°C · synthétique ou duvet selon budget',price:'50–180€',links:[{l:'Synthétique 0°C',u:'https://www.decathlon.fr/p/sac-de-couchage-de-trekking-mt500-0degc-synthetique/_/R-p-346447'},{l:'Duvet 0°C',u:'https://www.decathlon.fr/p/sac-de-couchage-de-trekking-mt900-0degc-duvet/_/R-p-309272'}]},
      {id:'coupevent',name:'Coupe-vent',note:null,price:'30–80€',links:[]},
      {id:'polaire',name:'Polaire',note:null,price:'25–70€',links:[]},
      {id:'raincover',name:'Raincover',note:'Souvent fourni avec le sac',price:'0–25€',links:[]},
      {id:'calecons',name:'Caleçons longs Merinos',note:'Évite les brûlures par frottement',price:'30–60€',links:[{l:'Merinos MT500',u:'https://www.decathlon.fr/p/sous-vetement-boxer-en-laine-merinos-de-trek-montagne-mt500-homme/_/R-p-306561'}]},
      {id:'chaussettes',name:'Chaussettes techniques',note:'Séchage rapide · éviter le coton',price:'8–20€',links:[]},
      {id:'claquettes',name:'Claquettes (camp)',note:null,price:'10–25€',links:[]},
      {id:'bonnet',name:'Bonnet ou buff',note:null,price:'10–30€',links:[]},
      {id:'camelbak',name:'Camelbak 3L',note:null,price:'20–50€',links:[]},
      {id:'lifestraw',name:'Lifestraw gourde filtrante',note:null,price:'25–45€',links:[]},
      {id:'barres',name:'Barres · fruits secs · noix',note:null,price:'15–30€',links:[]},
      {id:'lyophilise',name:'Lyophilisés · 2 repas/jour',note:null,price:'10–18€/repas',links:[]},
    ],
    recommande:[
      {id:'tshirt',name:'T-shirt Merinos',note:'Sèche vite · ne sent pas mauvais',price:'25–60€',links:[{l:'Merinos resist',u:'https://www.decathlon.fr/p/t-shirt-manches-courtes-en-laine-merinos-homme-merino-resist-kaki/_/R-p-356413'}]},
      {id:'serviette',name:'Serviette microfibre',note:null,price:'8–20€',links:[]},
      {id:'cuillere',name:'Cuillère trek pliable',note:null,price:'5–15€',links:[]},
      {id:'chaisecamp',name:'Chaise de camping pliante ultra-compacte MH500',note:'Confort au bivouac · compacte',price:'30–50€',links:[{l:'Decathlon',u:'https://www.decathlon.fr/p/chaise-basse-de-camping-pliante-et-ultra-compacte-500-m-vert/375910/c311c1m8975150'}]},
      {id:'solaire',name:'Protection solaire SPF50 (spray/stick)',note:'Altitude = UV x2',price:'5–15€',links:[{l:'Spray SPF50',u:'https://www.decathlon.fr/p/spray-solaire-active-spf-50-150-ml/351956/m8862018'}]},
    ],
    facultatif:[
      {id:'pochefiltre',name:'Poche à eau filtrante par gravité 6L',note:'Filtre 0,1µm · idéale bivouac',price:'25–45€',links:[{l:'Amazon',u:'https://www.amazon.fr/dp/B08ZYMXLMH'}]},
      {id:'oreiller',name:'Oreiller gonflable',note:null,price:'15–35€',links:[{l:'MT500',u:'https://www.decathlon.fr/p/oreiller-de-trekking-gonflable-mt500/_/R-p-343604'}]},
      {id:'pantpluie',name:'Pantalon de pluie',note:null,price:'20–60€',links:[]},
      {id:'sacetanche',name:'Sac étanche 13L',note:null,price:'20–40€',links:[{l:'Sea to Summit',u:'https://www.decathlon.fr/p/mp/sea-to-summit/sac-etanche-ultra-leger-sea-to-summit-13l/_/R-p-1a4f06ca'}]},
      {id:'crampons',name:'Crampons',note:'Début/fin de saison uniquement',price:'15–40€',links:[{l:'Amazon',u:'https://www.amazon.fr/s?k=crampons+randonn%C3%A9e+neige'}]},
      {id:'savon',name:'Savon multi-usages (camping)',note:'Corps · vaisselle · linge',price:'3–8€',links:[{l:'Decathlon',u:'https://www.decathlon.fr/p/savon-multi-usages-pour-le-camping/X8598405/m8598405'}]},
      {id:'rondelles',name:'Rondelles hiver pour bâtons (x2)',note:'Neige profonde · évite l’enfoncement',price:'3–8€',links:[{l:'Decathlon',u:'https://www.decathlon.fr/p/2-rondelles-hiver-de-baton-randonnee/346054/c1m8796724'}]},
      {id:'adaptgazcampingaz',name:'Adaptateur recharge gaz (Campingaz → vis 7/16")',note:'Recharge cartouches à valve',price:'8–15€',links:[{l:'Amazon',u:'https://www.amazon.fr/dp/B08PZ8X5N2'}]},
      {id:'adaptgazlindal',name:'Adaptateur recharge gaz (valve Lindal · Z15)',note:'Transfert entre cartouches',price:'8–15€',links:[{l:'Amazon',u:'https://www.amazon.fr/dp/B07SZLM17Y'}]},
    ]
  },
  journee:{
    indispensable:[
      {id:'chaussures',name:'Chaussures de rando',note:'Gore-Tex si saison humide',price:'60–150€',links:[]},
      {id:'batons',name:'Bâtons de marche',note:null,price:'25–70€',links:[]},
      {id:'sac20',name:'Sac à dos 20–30L',note:null,price:'25–80€',links:[]},
      {id:'coupevent',name:'Coupe-vent / imperméable',note:null,price:'30–80€',links:[]},
      {id:'camelbak',name:'Gourde / Camelbak 1.5–2L',note:null,price:'15–40€',links:[]},
      {id:'frontale',name:'Frontale',note:'Même en journée',price:'15–45€',links:[]},
      {id:'barres',name:'Barres · fruits secs · noix',note:null,price:'8–20€',links:[]},
      {id:'bonnet',name:'Casquette + buff',note:null,price:'10–25€',links:[]},
    ],
    recommande:[
      {id:'tshirt',name:'T-shirt Merinos',note:'Sèche vite · ne sent pas',price:'25–55€',links:[{l:'Merinos resist',u:'https://www.decathlon.fr/p/t-shirt-manches-courtes-en-laine-merinos-homme-merino-resist-kaki/_/R-p-356413'}]},
      {id:'chaussettes',name:'Chaussettes techniques',note:'Éviter le coton',price:'8–18€',links:[]},
      {id:'solaire',name:'Stick solaire SPF50',note:null,price:'5–12€',links:[]},
      {id:'powerbank',name:'Power bank',note:null,price:'20–50€',links:[]},
    ],
    facultatif:[
      {id:'poncho',name:'Poncho pluie',note:null,price:'10–30€',links:[]},
      {id:'crampons',name:'Crampons',note:'Début/fin de saison',price:'15–35€',links:[{l:'Amazon',u:'https://www.amazon.fr/s?k=crampons+randonn%C3%A9e+neige'}]},
    ]
  }
};

export interface GearInfo { tip: string; links: { label: string; url: string; favicon: string }[] }

export const GEAR_INFO: Record<string, GearInfo> = {
  chaussures: {
    tip: "L'élément le plus important de tout ton équipement. Prendre une demi-pointure au-dessus pour éviter de taper des orteils en descente. Semelle Vibram recommandée pour le grip. Gore-Tex utile en intersaison (neige fondante, boue). Un protège-orteils renforcé est un plus.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=chaussures+randonnee+gore-tex+vibram','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Vinted','url':'https://www.vinted.fr/catalog?search_text=chaussures+randonnee+gore-tex','favicon':'https://www.google.com/s2/favicons?domain=vinted.fr&sz=16'},{'label':'LeBonCoin','url':'https://www.leboncoin.fr/recherche?text=chaussures+randonnee','favicon':'https://www.google.com/s2/favicons?domain=leboncoin.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=chaussures+randonnee+gore-tex+vibram','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'}]
  },
  batons: {
    tip: "Réduisent la fatigue musculaire de ~30% en reportant l'effort sur les bras et les épaules. Indispensables pour les genoux en descente. Préférer des bâtons télescopiques carbone (légers). Vérifier la compatibilité des pointes avec le terrain.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=batons+randonnee+telescopiques+carbone','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Vinted','url':'https://www.vinted.fr/catalog?search_text=batons+randonnee+trekking','favicon':'https://www.google.com/s2/favicons?domain=vinted.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=batons+randonnee+carbone+telescopiques','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'},{'label':'LeBonCoin','url':'https://www.leboncoin.fr/recherche?text=batons+randonnee','favicon':'https://www.google.com/s2/favicons?domain=leboncoin.fr&sz=16'}]
  },
  sac50: {
    tip: "Capacité 50+10L pour les treks multi-jours. Priorité absolue au système de portage (ceinture ventrale, dos aéré), à la compatibilité poche à eau et à la répartition du poids proche du dos. Essayer chargé avant d'acheter.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=sac+a+dos+trek+50l','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Vinted','url':'https://www.vinted.fr/catalog?search_text=sac+dos+trekking+50l','favicon':'https://www.google.com/s2/favicons?domain=vinted.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=sac+a+dos+trek+50l+randonnee','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'},{'label':'LeBonCoin','url':'https://www.leboncoin.fr/recherche?text=sac+a+dos+trek+50l','favicon':'https://www.google.com/s2/favicons?domain=leboncoin.fr&sz=16'}]
  },
  sac20: {
    tip: "Pour une journée, 20-30L suffisent. Confort des bretelles et stabilité en priorité. Poche à eau (camelbak) fortement recommandée. Vérifier la présence d'un dos ventilé pour les journées chaudes.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=sac+a+dos+randonnee+journee+20l','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Vinted','url':'https://www.vinted.fr/catalog?search_text=sac+dos+randonnee+20l','favicon':'https://www.google.com/s2/favicons?domain=vinted.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=sac+dos+randonnee+20l+journee','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'},{'label':'LeBonCoin','url':'https://www.leboncoin.fr/recherche?text=sac+dos+randonnee','favicon':'https://www.google.com/s2/favicons?domain=leboncoin.fr&sz=16'}]
  },
  frontale: {
    tip: "Indispensable même en journée — départ avant l'aube, retard au coucher. Privilégier une frontale rechargeable USB. 200 lumens minimum. Vérifier l'autonomie et le mode veille.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=lampe+frontale+rechargeable+randonnee','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=frontale+rechargeable+usb+200+lumens','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'},{'label':'Vinted','url':'https://www.vinted.fr/catalog?search_text=lampe+frontale+randonnee','favicon':'https://www.google.com/s2/favicons?domain=vinted.fr&sz=16'}]
  },
  powerbank: {
    tip: "Indispensable pour les treks et les longues journées. 10 000mAh couvre 2-3 charges de smartphone. Préférer un modèle sous 200g avec charge rapide USB-C.",
    links: [{'label':'Amazon','url':'https://www.amazon.fr/s?k=powerbank+10000mah+usb-c+leger+randonnee','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'},{'label':'Vinted','url':'https://www.vinted.fr/catalog?search_text=powerbank+10000mah','favicon':'https://www.google.com/s2/favicons?domain=vinted.fr&sz=16'},{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=batterie+externe+randonnee','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'}]
  },
  matelas: {
    tip: "Le matelas autogonflant offre le meilleur compromis poids/confort/isolation. La valeur R (résistance thermique) doit dépasser 3 pour les nuits en altitude. Un bon matelas change complètement la qualité du sommeil en bivouac.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=matelas+autogonflant+trek+camping','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Vinted','url':'https://www.vinted.fr/catalog?search_text=matelas+autogonflant+camping','favicon':'https://www.google.com/s2/favicons?domain=vinted.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=matelas+gonflable+camping+leger+randonnee','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'},{'label':'LeBonCoin','url':'https://www.leboncoin.fr/recherche?text=matelas+camping+autogonflant','favicon':'https://www.google.com/s2/favicons?domain=leboncoin.fr&sz=16'}]
  },
  duvet: {
    tip: "Choisir selon la température de confort (pas la limite). Duvet naturel = plus léger et compressible mais sensible à l'humidité. Synthétique = résiste mieux à l'humidité, moins cher. En montagne, préférer 0°C de confort pour les nuits d'été en altitude.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=sac+de+couchage+trek+duvet+0+degres','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Vinted','url':'https://www.vinted.fr/catalog?search_text=sac+couchage+duvet+trek','favicon':'https://www.google.com/s2/favicons?domain=vinted.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=sac+couchage+duvet+trek+leger','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'},{'label':'LeBonCoin','url':'https://www.leboncoin.fr/recherche?text=sac+de+couchage+duvet','favicon':'https://www.google.com/s2/favicons?domain=leboncoin.fr&sz=16'}]
  },
  coupevent: {
    tip: "À avoir sur soi en permanence. L'altitude fait chuter la température brutalement, notamment en cas de vent. Un coupe-vent imperméable léger sous 200g se glisse dans la poche de la ceinture. Préférer Gore-Tex ou équivalent pour l'imperméabilité.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=veste+coupe+vent+impermeable+randonnee','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Vinted','url':'https://www.vinted.fr/catalog?search_text=veste+impermeable+randonnee+coupe+vent','favicon':'https://www.google.com/s2/favicons?domain=vinted.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=veste+coupe+vent+impermeable+randonnee','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'},{'label':'LeBonCoin','url':'https://www.leboncoin.fr/recherche?text=veste+randonnee+impermeable','favicon':'https://www.google.com/s2/favicons?domain=leboncoin.fr&sz=16'}]
  },
  polaire: {
    tip: "Couche intermédiaire essentielle entre le t-shirt et le coupe-vent. Polaire 200g/m2 pour toutes saisons. Se porte sous le coupe-vent en mouvement et seule lors des pauses.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=polaire+randonnee+montagne+200g','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Vinted','url':'https://www.vinted.fr/catalog?search_text=polaire+randonnee','favicon':'https://www.google.com/s2/favicons?domain=vinted.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=polaire+randonnee+montagne','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'},{'label':'LeBonCoin','url':'https://www.leboncoin.fr/recherche?text=polaire+randonnee','favicon':'https://www.google.com/s2/favicons?domain=leboncoin.fr&sz=16'}]
  },
  camelbak: {
    tip: "Compter 500ml à 1L par heure d'effort intense. En altitude, la déshydratation arrive sans sensation de soif. La poche à eau permet de boire sans s'arrêter ni sortir de gourde.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=poche+hydratation+camelbak+randonnee+2l','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=poche+eau+hydratation+randonnee+camelbak+2l','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'}]
  },
  crampons: {
    tip: "En début ou fin de saison, les névés (plaques de neige dure) peuvent être glissants et très dangereux. Les microcrampons légers (200g) suffisent hors haute montagne. Ne pas confondre avec les crampons d'alpinisme.",
    links: [{'label':'Amazon','url':'https://www.amazon.fr/s?k=microcrampons+neige+randonnee+leger','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'},{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=crampons+neige+randonnee+microcrampons','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'LeBonCoin','url':'https://www.leboncoin.fr/recherche?text=crampons+randonnee+neige','favicon':'https://www.google.com/s2/favicons?domain=leboncoin.fr&sz=16'}]
  },
  raincover: {
    tip: "Protège le sac et son contenu de la pluie. Souvent fourni avec les sacs haut de gamme. Indispensable sinon — le contenu d'un sac non protégé est trempé en 20 minutes sous une forte pluie.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=housse+pluie+sac+a+dos+imperméable','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=raincover+sac+dos+randonnee','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'},{'label':'Vinted','url':'https://www.vinted.fr/catalog?search_text=housse+pluie+sac+randonnee','favicon':'https://www.google.com/s2/favicons?domain=vinted.fr&sz=16'}]
  },
  calecons: {
    tip: "Évite les brûlures par frottement sur les longues distances. La laine mérinos est idéale : régule la température, antibactérienne, et sèche vite. Préférer un modèle sans coutures aux mauvais endroits.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=sous+vetement+merinos+randonnee+collant','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Vinted','url':'https://www.vinted.fr/catalog?search_text=collant+merinos+randonnee','favicon':'https://www.google.com/s2/favicons?domain=vinted.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=calecon+merinos+randonnee+trek','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'}]
  },
  chaussettes: {
    tip: "Éviter absolument le coton qui garde l'humidité et provoque des ampoules. Mérinos ou synthétique à séchage rapide. Prévoir 2 paires pour les treks. Une bonne paire de chaussettes peut faire la différence entre une rando agréable et des ampoules douloureuses.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=chaussettes+randonnee+merinos+trek','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=chaussettes+randonnee+merinos+trek','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'},{'label':'Vinted','url':'https://www.vinted.fr/catalog?search_text=chaussettes+randonnee+merinos','favicon':'https://www.google.com/s2/favicons?domain=vinted.fr&sz=16'}]
  },
  claquettes: {
    tip: "Permettent aux pieds de respirer et de récupérer au camp. Ultra-légères et compressibles. Indispensables pour les bivouacs en refuges où l'on ne peut pas garder ses chaussures.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=claquettes+leger+camping+randonnee','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=sandales+legeres+camping+trek','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'},{'label':'Vinted','url':'https://www.vinted.fr/catalog?search_text=claquettes+camping','favicon':'https://www.google.com/s2/favicons?domain=vinted.fr&sz=16'}]
  },
  bonnet: {
    tip: "Le buff multifonction fait casquette, bonnet, tour de cou et protection solaire. Un seul objet pour 4 usages. Incontournable en montagne où les conditions changent rapidement.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=buff+tour+de+cou+multifonction+randonnee','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=buff+tour+de+cou+randonnee+multifonction','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'},{'label':'Vinted','url':'https://www.vinted.fr/catalog?search_text=buff+tour+de+cou+randonnee','favicon':'https://www.google.com/s2/favicons?domain=vinted.fr&sz=16'}]
  },
  lifestraw: {
    tip: "Permet de boire directement depuis un torrent ou lac de montagne. Élimine 99.9999% des bactéries et parasites. Léger (30g) et ne nécessite aucun traitement chimique.",
    links: [{'label':'Amazon','url':'https://www.amazon.fr/s?k=lifestraw+gourde+filtrante+randonnee','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'},{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=gourde+filtrante+eau+randonnee+lifestraw','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'}]
  },
  barres: {
    tip: "Privilégier des barres riches en glucides complexes et en protéines (> 10g/barre). Compléter avec des fruits secs (dattes, abricots) et des oléagineux (noix, amandes) pour l'énergie longue durée. Prévoir 200-300 kcal par heure d'effort.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=barres+energie+randonnee+trek','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=barres+energie+randonnee+fruits+secs','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'}]
  },
  lyophilise: {
    tip: "Repas complets déshydratés, très légers (100-150g) et rapides à préparer (eau chaude 10 min). Compter 2 repas/jour en trek. Les marques Trek'n'Eat et Expedition Foods offrent un bon rapport qualité/prix/goût.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=repas+lyophilise+trek+randonnee','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=repas+lyophilise+randonnee+trek','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'},{'label':'LeBonCoin','url':'https://www.leboncoin.fr/recherche?text=repas+lyophilise+expedition','favicon':'https://www.google.com/s2/favicons?domain=leboncoin.fr&sz=16'}]
  },
  tshirt: {
    tip: "La laine mérinos sèche vite, ne retient pas les odeurs (portables plusieurs jours), et régule la température. Évite de devoir laver ou changer de t-shirt chaque jour en trek.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=tshirt+laine+merinos+randonnee+homme','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Vinted','url':'https://www.vinted.fr/catalog?search_text=t-shirt+merinos+randonnee','favicon':'https://www.google.com/s2/favicons?domain=vinted.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=tshirt+laine+merinos+randonnee','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'},{'label':'LeBonCoin','url':'https://www.leboncoin.fr/recherche?text=t-shirt+merinos','favicon':'https://www.google.com/s2/favicons?domain=leboncoin.fr&sz=16'}]
  },
  serviette: {
    tip: "Sèche 3x plus vite qu'une serviette classique, ultra-compressible (taille d'un poing). Indispensable en refuges et bivouacs. Choisir taille M ou L pour plus de confort.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=serviette+microfibre+trek+compressible','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=serviette+microfibre+trek+camping','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'},{'label':'Vinted','url':'https://www.vinted.fr/catalog?search_text=serviette+microfibre+randonnee','favicon':'https://www.google.com/s2/favicons?domain=vinted.fr&sz=16'}]
  },
  cuillere: {
    tip: "Cuillère longue indispensable pour les lyophilisés (sachets profonds). Le titane est ultra-léger (15g) et indestructible. Prévoir aussi une fourchette pliable pour les repas solides.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=couverts+trek+pliables+titane','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=cuillere+titane+randonnee+lyophilise+longue','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'}]
  },
  oreiller: {
    tip: "Améliore considérablement la qualité du sommeil en bivouac. Les modèles gonflables pèsent 50-80g et tiennent dans une poche. Un sommeil de qualité est essentiel pour la récupération en trek.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=oreiller+gonflable+trek+camping+leger','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=oreiller+gonflable+camping+ultra+leger','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'},{'label':'Vinted','url':'https://www.vinted.fr/catalog?search_text=oreiller+gonflable+camping','favicon':'https://www.google.com/s2/favicons?domain=vinted.fr&sz=16'}]
  },
  pantpluie: {
    tip: "À avoir en cas de pluie prolongée ou de traversée de buissons mouillés. Se glisse dans la poche. Privilégier un modèle avec ouverture latérale pour ne pas avoir à enlever les chaussures.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=pantalon+pluie+impermeable+randonnee','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Vinted','url':'https://www.vinted.fr/catalog?search_text=pantalon+pluie+impermeable+randonnee','favicon':'https://www.google.com/s2/favicons?domain=vinted.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=pantalon+pluie+randonnee+impermeable','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'}]
  },
  solaire: {
    tip: "En altitude, les UV sont multipliés : +10% tous les 1000m. Au-delà de 2000m en été, sans protection, un coup de soleil sévère peut survenir en moins d'une heure. SPF50 minimum, à renouveler toutes les 2h, sans oublier les lèvres, les oreilles et le dessous du menton (réverbération de la neige). Le spray s'applique vite sur les grandes zones, le stick est pratique pour le visage et les lèvres.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/p/spray-solaire-active-spf-50-150-ml/351956/m8862018','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=creme+solaire+spf50+sport+altitude+montagne','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'}]
  },
  sacetanche: {
    tip: "Protège les affaires sensibles (papiers, téléphone, batterie, carte) de la pluie et des éclaboussures. 10-13L suffisent. Également utilisable comme sac étanche pour traversées de gués.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=sac+etanche+randonnee+trek+dry+bag','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=sac+etanche+randonnee+dry+bag+10l','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'},{'label':'Vinted','url':'https://www.vinted.fr/catalog?search_text=sac+etanche+randonnee','favicon':'https://www.google.com/s2/favicons?domain=vinted.fr&sz=16'}]
  },
  poncho: {
    tip: "Couvre à la fois le randonneur et le sac à dos. Solution économique contre la pluie en journée. Moins performant qu'une veste Gore-Tex mais beaucoup moins cher.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=poncho+pluie+randonnee+impermeable','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=poncho+pluie+randonnee+avec+sac','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'},{'label':'Vinted','url':'https://www.vinted.fr/catalog?search_text=poncho+pluie+randonnee','favicon':'https://www.google.com/s2/favicons?domain=vinted.fr&sz=16'}]
  },
  tente: {
    tip: "Tente légère 3 saisons avec double toit. Vérifier le poids total (tentes + sardines + arceaux), l'espace intérieur et la facilité de montage. Une tente 2 places pour 1 randonneur = confort maximal.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=tente+trek+randonnee+legere+2+places','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Vinted','url':'https://www.vinted.fr/catalog?search_text=tente+randonnee+trek','favicon':'https://www.google.com/s2/favicons?domain=vinted.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=tente+ultra+legere+randonnee+trek','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'},{'label':'LeBonCoin','url':'https://www.leboncoin.fr/recherche?text=tente+randonnee','favicon':'https://www.google.com/s2/favicons?domain=leboncoin.fr&sz=16'}]
  },
  rechaud: {
    tip: "Réchaud à gaz compact pour les bivouacs. Une cartouche 230g dure 2-3 jours d'utilisation normale. Préférer un modèle avec piezoélectrique (allumage sans briquet). Toujours emporter un briquet de secours.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=rechaud+gaz+trek+compact+randonnee','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=rechaud+camping+gaz+leger+piezo','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'},{'label':'LeBonCoin','url':'https://www.leboncoin.fr/recherche?text=rechaud+gaz+camping+trek','favicon':'https://www.google.com/s2/favicons?domain=leboncoin.fr&sz=16'}]
  },
  trousse: {
    tip: "Contenu minimum : pansements variés, bande élastique, antiseptique, anti-douleur, anti-inflammatoire, couverture de survie, pince à épiler (tiques), compresses stériles. Vérifier la date de péremption chaque saison.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=trousse+premiers+secours+randonnee+montagne','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=trousse+secours+randonnee+complete+montagne','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'},{'label':'LeBonCoin','url':'https://www.leboncoin.fr/recherche?text=trousse+secours+randonnee','favicon':'https://www.google.com/s2/favicons?domain=leboncoin.fr&sz=16'}]
  },
  filtreeau: {
    tip: "Permet de boire depuis n'importe quelle source naturelle. Le Sawyer Squeeze et le Lifestraw Go sont les références. Beaucoup plus léger et économique que de transporter toute l'eau nécessaire sur un trek.",
    links: [{'label':'Amazon','url':'https://www.amazon.fr/s?k=filtre+eau+portable+randonnee+sawyer+lifestraw','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'},{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=filtre+eau+portable+randonnee','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'LeBonCoin','url':'https://www.leboncoin.fr/recherche?text=filtre+eau+randonnee','favicon':'https://www.google.com/s2/favicons?domain=leboncoin.fr&sz=16'}]
  },
  gourde1l: {
    tip: "Indispensable en complément de la poche à eau. Une gourde 1L permet d'avoir une réserve d'urgence et de remplir sans enlever le sac. Préférer inox ou Tritan (sans BPA).",
    links: [
      {label:'Decathlon',url:'https://www.decathlon.fr/search?query=gourde+1l+randonnee+inox',favicon:'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},
      {label:'Amazon',url:'https://www.amazon.fr/s?k=gourde+1l+randonnee+inox',favicon:'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'}
    ]
  },
  sacpoubelle: {
    tip: "Principe LNT (Leave No Trace) — chaque randonneur repart avec ses propres déchets. Un sac congélation hermétique évite les odeurs. Prévoir aussi pour les déchets organiques en zone protégée.",
    links: [
      {label:'Decathlon',url:'https://www.decathlon.fr/search?query=sac+poubelle+randonnee',favicon:'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},
      {label:'Amazon',url:'https://www.amazon.fr/s?k=sac+poubelle+congelation+hermétique',favicon:'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'}
    ]
  },
  carte: {
    tip: "Carte IGN 1:25000 de la zone. Indispensable en complément du GPS — en cas de panne de batterie, une carte papier peut sauver la mise. Se prépare à l'avance, les zones blanches n'existent pas sur une carte IGN.",
    links: [{'label':'IGN Boutique','url':'https://boutique.ign.fr/cartes-randonnee','favicon':'https://www.google.com/s2/favicons?domain=ign.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=carte+IGN+25000+randonnee','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'},{'label':'LeBonCoin','url':'https://www.leboncoin.fr/recherche?text=carte+IGN+randonnee+topo','favicon':'https://www.google.com/s2/favicons?domain=leboncoin.fr&sz=16'}]
  },
  pochefiltre: {
    tip: "Poche à eau souple avec filtre par gravité : on remplit à la source, on suspend, et l'eau se filtre seule sans effort ni pompage. Filtration à 0,1µm qui élimine bactéries et parasites. Idéale au bivouac pour filtrer plusieurs litres d'un coup (cuisine, gourdes) sans transporter toute son eau.",
    links: [{'label':'Amazon','url':'https://www.amazon.fr/dp/B08ZYMXLMH','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'},{'label':'Decathlon','url':'https://www.decathlon.fr/search?query=filtre+eau+gravite+randonnee','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'}]
  },
  savon: {
    tip: "Savon biodégradable multi-usages : corps, cheveux, vaisselle et linge avec un seul produit. Toujours se laver et rincer à au moins 60m des lacs et cours d'eau (principe Leave No Trace), même avec un savon biodégradable. Un petit format suffit pour un trek de plusieurs jours.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/p/savon-multi-usages-pour-le-camping/X8598405/m8598405','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=savon+biodegradable+camping+multi+usages','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'}]
  },
  rondelles: {
    tip: "Rondelles larges qui se clipsent au bout des bâtons pour éviter qu'ils ne s'enfoncent dans la neige profonde ou la boue. Indispensables pour la rando hivernale et les raquettes. Vérifier le diamètre de pointe compatible avec tes bâtons avant d'acheter.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/p/2-rondelles-hiver-de-baton-randonnee/346054/c1m8796724','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=rondelles+hiver+baton+randonnee+neige','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'}]
  },
  adaptgazcampingaz: {
    tip: "Adaptateur qui permet de recharger une cartouche à valve (7/16\") depuis une bouteille de gaz Campingaz à fermeture baïonnette. Économise beaucoup sur le long terme en évitant de racheter des cartouches jetables. À manipuler à l'extérieur, à l'écart de toute flamme, et sans dépasser le remplissage de la cartouche.",
    links: [{'label':'Amazon','url':'https://www.amazon.fr/dp/B08PZ8X5N2','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'}]
  },
  adaptgazlindal: {
    tip: "Adaptateur à valve Lindal pour transférer du gaz d'une grosse cartouche vers une petite (ou recharger une cartouche à valve). Compatible avec la plupart des cartouches à visser de camping. Recharger toujours à froid, à l'extérieur et loin de toute source de chaleur ou d'étincelle.",
    links: [{'label':'Amazon','url':'https://www.amazon.fr/dp/B07SZLM17Y','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'}]
  },
  chaisecamp: {
    tip: "Chaise pliante ultra-compacte pour le confort au bivouac : se replie à la taille d'une gourde et pèse ~500g. Un vrai luxe léger après une longue journée de marche. Vérifier le poids et le volume replié — à réserver aux treks où le confort prime sur l'ultralight.",
    links: [{'label':'Decathlon','url':'https://www.decathlon.fr/p/chaise-basse-de-camping-pliante-et-ultra-compacte-500-m-vert/375910/c311c1m8975150','favicon':'https://www.google.com/s2/favicons?domain=decathlon.fr&sz=16'},{'label':'Amazon','url':'https://www.amazon.fr/s?k=chaise+camping+pliante+ultra+compacte+legere','favicon':'https://www.google.com/s2/favicons?domain=amazon.fr&sz=16'}]
  }
};

export const LVLS = {
  newbie: { l: 'Débutant', cls: 'ta', next: 'Intermédiaire', pct: 20 },
  intermediate: { l: 'Intermédiaire', cls: 'tg', next: 'Expert', pct: 55 },
  expert: { l: 'Expert', cls: 'tb', next: null, pct: 100 },
} as const

export type Level = keyof typeof LVLS
export type KitMode = 'trek' | 'journee'
export type KitStatus = 'have' | 'want' | 'maybe' | 'skip'
