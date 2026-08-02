// Documents légaux d'ALTImates.
//
// Rédigés à partir du fonctionnement RÉEL de l'application : chaque affirmation
// sur les données collectées, les destinataires et les durées correspond à ce
// que fait le code (collections de `core/firebase/collections.ts`, règles de
// `firestore.rules`, origines tierces autorisées par la CSP de `vercel.json`,
// compteurs de `api/_ratelimit.ts`). Ils n'ont pas fait l'objet d'une relecture
// juridique professionnelle.
//
// À maintenir en même temps que le code : ajouter une collection, une origine
// externe ou un service tiers sans mettre ces textes à jour les rend faux.
//
// Sur l'identité de l'éditeur : ALTImates est publié par un particulier à titre
// non professionnel. L'article 6 III 2 de la LCEN permet dans ce cas de ne pas
// afficher publiquement nom et adresse, à condition d'avoir communiqué son
// identité à l'hébergeur — ce qui est le cas via le compte Vercel. C'est
// l'option retenue ici. Pour afficher l'identité complète à la place, remplacer
// la section « Éditeur » des mentions légales.

export interface LegalSection {
  heading: string
  /** Paragraphes de texte. Une puce commence par « — ». */
  body: string[]
}

export interface LegalDoc {
  id: 'mentions' | 'confidentialite' | 'cgu'
  /** Libellé court, utilisé dans les liens de pied de page. */
  short: string
  title: string
  updated: string
  sections: LegalSection[]
}

/** Date de dernière révision affichée en tête de chaque document. */
const UPDATED = '2 août 2026'

/** Adresse de contact publiée dans les trois documents. */
export const CONTACT_EMAIL = 'Contact.altimates@gmail.com'

export const LEGAL_DOCS: LegalDoc[] = [
  {
    id: 'mentions',
    short: 'Mentions légales',
    title: 'Mentions légales',
    updated: UPDATED,
    sections: [
      {
        heading: 'Éditeur',
        body: [
          'ALTImates est une application privée de préparation de randonnées en montagne, destinée à un groupe restreint de participants qui se connaissent.',
          'Elle est éditée par un particulier, à titre non professionnel et sans but lucratif. Conformément à l’article 6 III 2 de la loi pour la confiance dans l’économie numérique, l’éditeur a communiqué son identité à son hébergeur et n’en publie ici que les coordonnées de contact.',
          `Contact : ${CONTACT_EMAIL}`,
          'Aucun bien ni service n’est vendu sur l’application, aucun paiement n’y est encaissé, et aucun espace publicitaire n’y est commercialisé.',
        ],
      },
      {
        heading: 'Hébergement',
        body: [
          '— Application web : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — vercel.com',
          '— Authentification et base de données : Google Cloud / Firebase, exploité par Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irlande — firebase.google.com',
        ],
      },
      {
        heading: 'Services tiers',
        body: [
          'L’application fait appel aux services suivants, et à eux seuls :',
          '— Google Sign-In et le service d’authentification Firebase, pour la connexion (par compte Google ou par lien reçu par e-mail).',
          '— Brevo (Sendinblue SAS, 106 boulevard Haussmann, 75008 Paris), pour l’envoi du lien de connexion par e-mail. En cas d’indisponibilité, l’envoi retombe sur le service d’e-mail de Firebase.',
          '— open-meteo.com, pour les prévisions météo affichées sur les sorties. Aucune donnée personnelle ne lui est transmise : seules des coordonnées géographiques de sommets.',
          '— Google Fonts, pour les polices de caractères, et le service d’icônes de Google, pour les logos des sites marchands de la liste de matériel. Ces requêtes exposent votre adresse IP à Google.',
        ],
      },
      {
        heading: 'Propriété intellectuelle',
        body: [
          'Le code, l’identité visuelle et les contenus rédactionnels de l’application sont la propriété de l’éditeur.',
          'Les contenus publiés par les membres — photos, messages, idées, sorties proposées, dépenses — restent la propriété de leurs auteurs. En les publiant, un membre en autorise l’affichage aux autres membres du groupe, et à eux seuls.',
          'Les descriptions et liens de matériel renvoient vers des sites marchands tiers, dont l’éditeur n’est ni partenaire ni affilié : aucun lien d’affiliation, aucune commission.',
        ],
      },
      {
        heading: 'Responsabilité',
        body: [
          'ALTImates est un outil d’organisation. Les informations qu’il affiche — prévisions météo, distances, dénivelés, durées, listes de matériel, poids estimés — sont indicatives et peuvent être erronées, incomplètes ou périmées.',
          'Elles ne remplacent ni la préparation d’une sortie, ni la consultation des bulletins officiels (météo, risque d’avalanche, arrêtés municipaux ou préfectoraux d’accès), ni le jugement des participants sur le terrain.',
          'Chacun reste seul responsable de sa décision de partir, de son itinéraire, de son équipement et de sa sécurité. L’éditeur ne peut être tenu responsable d’un dommage survenu lors d’une sortie organisée avec l’aide de l’application.',
        ],
      },
      {
        heading: 'Signalement',
        body: [
          `Pour signaler un contenu illicite, une erreur, ou pour toute question relative à ces mentions : ${CONTACT_EMAIL}`,
        ],
      },
    ],
  },

  {
    id: 'confidentialite',
    short: 'Confidentialité',
    title: 'Politique de confidentialité',
    updated: UPDATED,
    sections: [
      {
        heading: 'Le principe',
        body: [
          'ALTImates est un outil de groupe privé. Vos données servent à faire fonctionner l’application pour vous et pour les membres de votre cordée. Elles ne sont ni vendues, ni louées, ni transmises à des tiers à des fins commerciales, ni utilisées pour de la publicité.',
          'Il n’y a aucun cookie publicitaire, aucun traceur, aucune mesure d’audience, aucun profilage.',
        ],
      },
      {
        heading: 'Ce que nous collectons, et pourquoi',
        body: [
          '— Votre adresse e-mail. Elle vous identifie et permet de vérifier que vous faites partie du groupe autorisé. Sans elle, aucun accès n’est possible.',
          '— Votre prénom, tel que vous le saisissez ou tel que le fournit votre compte Google. Il vous identifie auprès des autres membres : sans lui, personne ne saurait qui a voté, qui a avancé de l’argent ou qui prend en charge quel équipement.',
          '— Votre photo de profil, si vous choisissez d’en ajouter une. Elle est facultative.',
          '— Ce que vous publiez : sorties proposées, votes, messages de la radio de groupe, idées et commentaires, disponibilités du calendrier, dépenses partagées, moyen de transport déclaré, articles de la checklist de départ, photos de sortie.',
          '— Votre profil de randonnée : niveau déclaré, statistiques que vous saisissez à la main, état de votre liste de matériel, sorties passées que vous renseignez.',
        ],
      },
      {
        heading: 'Ce qui est conservé techniquement',
        body: [
          '— Un compteur anti-abus lors des demandes de lien de connexion : votre adresse e-mail et votre adresse IP y sont enregistrées sous une forme encodée, avec le nombre de demandes. Il sert uniquement à limiter les envois (3 par quart d’heure et par adresse, 10 par heure et par IP) afin d’éviter que quelqu’un ne se serve de l’application pour inonder une boîte mail.',
          '— Sur votre appareil : votre session de connexion, un indicateur signalant que vous avez déjà vu la visite guidée, et — le temps d’une connexion par lien e-mail seulement — l’adresse saisie, effacée dès la connexion terminée.',
          'Aucun historique de navigation, aucune géolocalisation de votre appareil, aucune donnée de votre téléphone en dehors des photos que vous choisissez d’envoyer.',
        ],
      },
      {
        heading: 'Vos photos',
        body: [
          'Les photos sont réduites et compressées sur votre appareil avant tout envoi : jusqu’à 1280 pixels et 200 Ko pour une photo de sortie, un carré de 256 pixels et environ 40 Ko pour une photo de profil.',
          'Elles sont stockées dans la base de données de l’application, pas dans un service de stockage d’images tiers. Elles ne sont accessibles qu’aux membres du groupe.',
          'Les photos de sortie ne peuvent être publiées que par l’organisateur de la sortie, dans la limite de six par sortie.',
        ],
      },
      {
        heading: 'Qui y a accès',
        body: [
          'Les membres du groupe autorisé, et eux seuls. Le contrôle est appliqué côté serveur : une personne dont l’adresse ne figure pas dans la liste des membres ne peut rien lire, même en connaissant l’adresse de l’application.',
          'Certaines actions sont réservées à leur auteur : seul celui qui a avancé une dépense peut la modifier ou la supprimer, seul l’auteur d’une photo peut la retirer, chacun ne déclare que ses propres disponibilités et son propre transport.',
          'Les administrateurs du groupe disposent de droits étendus (gestion de la liste des membres, suppression de contenus).',
          'Les prestataires techniques cités dans les mentions légales traitent ces données pour le compte de l’éditeur, dans le cadre de leurs propres conditions. Un transfert hors Union européenne a lieu du fait de l’hébergement chez Vercel, aux États-Unis.',
        ],
      },
      {
        heading: 'Combien de temps',
        body: [
          'Vos données sont conservées tant que vous êtes membre du groupe. Les contenus rattachés à une sortie — dépenses, transport, photos — sont conservés tant que la sortie existe.',
          'Le bouton « Réinitialiser » du Base Camp efface votre profil et votre liste de matériel. Vos photos et vos messages sont supprimables un par un, par vous.',
          `Pour la suppression complète de votre compte et de tous vos contenus, adressez la demande à ${CONTACT_EMAIL}. Elle sera traitée dans un délai d’un mois.`,
        ],
      },
      {
        heading: 'Vos droits',
        body: [
          'Le règlement général sur la protection des données vous donne un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité sur vos données.',
          'Une partie s’exerce directement dans l’application : votre profil est modifiable à tout moment depuis le Base Camp, vos contenus y sont supprimables.',
          `Pour le reste, écrivez à ${CONTACT_EMAIL}.`,
          'Si la réponse ne vous satisfait pas, vous pouvez introduire une réclamation auprès de la CNIL — www.cnil.fr.',
        ],
      },
      {
        heading: 'Sécurité',
        body: [
          'Les échanges sont chiffrés (HTTPS, avec HSTS). Les règles d’accès à la base de données sont vérifiées côté serveur, et pas seulement dans l’interface : masquer un bouton ne protège rien.',
          'Les adresses des membres ne sont lisibles que par les membres eux-mêmes, afin qu’un compte extérieur ne puisse pas les énumérer.',
          'Les liens saisis par les membres sont contrôlés avant affichage, et une politique de sécurité stricte limite les ressources externes que la page peut charger.',
        ],
      },
    ],
  },

  {
    id: 'cgu',
    short: 'Conditions d’utilisation',
    title: 'Conditions générales d’utilisation',
    updated: UPDATED,
    sections: [
      {
        heading: 'Objet',
        body: [
          'Les présentes conditions régissent l’utilisation d’ALTImates. Se connecter à l’application vaut acceptation de ces conditions et de la politique de confidentialité.',
          'L’application est fournie gratuitement, à titre non professionnel.',
        ],
      },
      {
        heading: 'Accès',
        body: [
          'L’accès est réservé aux personnes dont l’adresse e-mail figure dans la liste des membres autorisés, tenue par les administrateurs du groupe.',
          'Il est personnel : ne partagez ni votre lien de connexion, ni votre session. Le lien reçu par e-mail vaut authentification, quiconque en dispose peut se connecter à votre place.',
          'L’éditeur peut retirer un accès à tout moment, notamment en cas de manquement à ces conditions ou de départ du groupe.',
          'Le service est fourni sans garantie de disponibilité : il peut être interrompu, modifié ou arrêté, y compris sans préavis. Il est conseillé de ne pas en faire l’unique support d’une information critique pour une sortie.',
        ],
      },
      {
        heading: 'Règles de publication',
        body: [
          'Vous êtes responsable de ce que vous publiez. Sont notamment interdits : les contenus illicites, injurieux, discriminatoires ou harcelants ; les contenus portant atteinte aux droits d’un tiers ; l’usurpation de l’identité d’un autre membre.',
          'Les photos de sortie sont visibles par tous les membres du groupe : ne publiez pas la photo d’une personne sans son accord, et retirez-la à sa demande.',
          'L’éditeur peut supprimer sans préavis tout contenu contraire à ces règles.',
        ],
      },
      {
        heading: 'Dépenses partagées',
        body: [
          'L’onglet Dépenses calcule des soldes et propose une série de remboursements, à titre purement indicatif. Aucun paiement n’est encaissé, déclenché ni garanti par l’application : l’argent circule entre les participants, par leurs propres moyens.',
          'Les montants affichés dépendent de ce que chacun saisit. En cas d’erreur ou de désaccord, le règlement se fait entre les personnes concernées ; l’éditeur n’intervient pas et n’arbitre pas.',
        ],
      },
      {
        heading: 'Transport',
        body: [
          'Les déclarations de transport sont indicatives et n’engagent que leurs auteurs. Le covoiturage éventuel se fait entre participants, sous leur seule responsabilité, y compris pour ce qui concerne l’assurance du véhicule et le partage des frais.',
        ],
      },
      {
        heading: 'Sécurité en montagne',
        body: [
          'ALTImates ne vous dit pas si une sortie est sûre, et ne saurait le faire. Les prévisions météo, les tracés, les temps de marche, les cotations de difficulté et les listes de matériel sont indicatifs et peuvent être faux.',
          'La décision de partir, le choix de l’itinéraire, l’évaluation des conditions et l’équipement emporté relèvent de votre seule responsabilité et de celle du groupe. Consultez les sources officielles avant chaque sortie, et renoncez sans hésiter en cas de doute.',
        ],
      },
      {
        heading: 'Évolution des conditions',
        body: [
          'Ces conditions peuvent être modifiées, notamment pour suivre les évolutions de l’application. La version en vigueur est celle affichée ici, avec sa date de révision. Continuer à utiliser l’application après une modification vaut acceptation de la nouvelle version.',
        ],
      },
      {
        heading: 'Droit applicable',
        body: [
          `Ces conditions sont soumises au droit français. En cas de difficulté, une solution amiable sera recherchée en priorité, à l’adresse ${CONTACT_EMAIL}.`,
        ],
      },
    ],
  },
]

/** Retrouve un document par son identifiant, sans jamais renvoyer undefined. */
export function findLegalDoc(id: LegalDoc['id']): LegalDoc {
  return LEGAL_DOCS.find((d) => d.id === id) ?? LEGAL_DOCS[0]
}
