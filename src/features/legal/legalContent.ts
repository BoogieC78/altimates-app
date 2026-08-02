// Documents légaux d'ALTImates.
//
// ⚠️ TEXTES PROVISOIRES. Ils décrivent fidèlement ce que l'application fait
// réellement aujourd'hui (Firebase Auth, Firestore, Vercel, open-meteo), mais
// ils n'ont pas été rédigés ni relus par un juriste. Ils seront remplacés par
// les documents définitifs. Tout ce qui reste à renseigner est marqué
// explicitement par « [à compléter] » plutôt que deviné : une mention légale
// inventée (raison sociale, adresse, numéro) est pire qu'une mention absente.
//
// Tout le contenu vit dans ce seul module pour que le remplacement soit une
// réécriture de données, sans toucher aux composants.

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

export const LEGAL_PROVISIONAL_NOTICE =
  'Version provisoire. Ces textes décrivent le fonctionnement réel de l’application mais restent à valider ; les documents définitifs les remplaceront.'

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
          'ALTImates est une application privée de préparation de randonnées, développée et éditée à titre non professionnel pour un groupe restreint de participants.',
          'Éditeur et responsable de la publication : [à compléter — nom et prénom].',
          'Contact : [à compléter — adresse e-mail de contact].',
          'L’application n’est pas exploitée commercialement : aucun bien ni service n’y est vendu, et aucun paiement n’y est encaissé.',
        ],
      },
      {
        heading: 'Hébergement',
        body: [
          '— Application web : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis (vercel.com).',
          '— Authentification et base de données : Google Cloud / Firebase, Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irlande (firebase.google.com).',
        ],
      },
      {
        heading: 'Propriété intellectuelle',
        body: [
          'Le code, l’identité visuelle et les contenus rédactionnels de l’application sont la propriété de l’éditeur.',
          'Les contenus publiés par les membres (photos, messages, idées, dépenses) restent la propriété de leurs auteurs. En les publiant, un membre autorise leur affichage aux autres membres du groupe, et à eux seuls.',
        ],
      },
      {
        heading: 'Services tiers',
        body: [
          '— Google Sign-In et le lien de connexion par e-mail, pour l’authentification.',
          '— open-meteo.com, pour les prévisions météo affichées sur les sorties.',
          '— Brevo, pour l’envoi de l’e-mail contenant le lien de connexion.',
        ],
      },
      {
        heading: 'Responsabilité',
        body: [
          'ALTImates est un outil d’organisation. Les informations qu’il affiche — météo, distances, dénivelés, durées, listes de matériel — sont indicatives et peuvent être erronées ou périmées.',
          'Elles ne remplacent ni la préparation d’une sortie, ni la consultation des bulletins officiels (météo, avalanche, arrêtés d’accès), ni le jugement des participants sur le terrain. Chacun reste seul responsable de sa décision de partir, de son équipement et de sa sécurité.',
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
        heading: 'Ce que nous collectons',
        body: [
          '— Adresse e-mail : indispensable pour vous connecter et vérifier que vous faites partie du groupe autorisé.',
          '— Prénom : celui que vous saisissez à la première connexion, affiché aux autres membres.',
          '— Photo de profil, si vous en ajoutez une.',
          '— Ce que vous publiez dans l’application : votes sur les sorties, sorties proposées, messages de la radio, idées, disponibilités, dépenses partagées, transport déclaré, photos de sortie.',
          '— Votre profil de randonnée : niveau, statistiques saisies à la main, état de votre kit.',
          'Aucun cookie publicitaire, aucun traceur, aucune mesure d’audience. L’application ne conserve localement que ce qui est nécessaire à votre session de connexion.',
        ],
      },
      {
        heading: 'Pourquoi',
        body: [
          'Ces données servent uniquement à faire fonctionner l’application : vous identifier, vous montrer aux autres membres du groupe, et organiser les sorties. Elles ne sont ni vendues, ni louées, ni utilisées à des fins publicitaires.',
        ],
      },
      {
        heading: 'Qui y a accès',
        body: [
          'Les membres du groupe autorisé, et eux seuls. L’accès est contrôlé côté serveur : une personne dont l’adresse ne figure pas dans la liste des membres ne peut rien lire, même en connaissant l’adresse de l’application.',
          'Les prestataires techniques (Google/Firebase pour la base de données, Vercel pour l’hébergement, Brevo pour l’e-mail de connexion) traitent ces données pour notre compte, dans le cadre de leurs propres conditions.',
        ],
      },
      {
        heading: 'Combien de temps',
        body: [
          'Vos données sont conservées tant que vous êtes membre du groupe. Les contenus liés à une sortie (dépenses, transport, photos) sont conservés tant que la sortie existe.',
          'Le bouton « Réinitialiser » du Base Camp efface votre profil et votre kit. Pour la suppression complète de votre compte et de vos contenus, adressez la demande au contact indiqué dans les mentions légales.',
        ],
      },
      {
        heading: 'Vos droits',
        body: [
          'Conformément au RGPD, vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation et d’opposition sur vos données, ainsi que d’un droit à la portabilité.',
          'Une partie de ces droits s’exerce directement dans l’application : votre profil est modifiable à tout moment depuis le Base Camp, vos photos et vos messages sont supprimables par vous. Pour le reste, écrivez au contact indiqué dans les mentions légales.',
          'Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).',
        ],
      },
      {
        heading: 'Sécurité',
        body: [
          'Les échanges sont chiffrés (HTTPS). Les règles d’accès à la base de données sont vérifiées côté serveur, et pas seulement dans l’interface : masquer un bouton ne protège rien.',
          'Les photos sont réduites et compressées sur votre appareil avant d’être envoyées.',
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
          'Les présentes conditions régissent l’utilisation d’ALTImates. Se connecter à l’application vaut acceptation de ces conditions.',
        ],
      },
      {
        heading: 'Accès',
        body: [
          'L’accès est réservé aux personnes dont l’adresse e-mail figure dans la liste des membres autorisés. Il est personnel : ne partagez pas votre lien de connexion.',
          'L’éditeur peut retirer un accès à tout moment, notamment en cas de manquement à ces conditions.',
          'Le service est fourni sans garantie de disponibilité : il peut être interrompu, modifié ou arrêté, y compris sans préavis.',
        ],
      },
      {
        heading: 'Règles de publication',
        body: [
          'Vous êtes responsable de ce que vous publiez. Sont notamment interdits : les contenus illicites, injurieux, discriminatoires ou harcelants, les contenus violant les droits d’un tiers (photos de personnes non consentantes, œuvres protégées), et l’usurpation de l’identité d’un autre membre.',
          'Les photos de sortie sont visibles par tous les membres du groupe : ne publiez pas une photo de quelqu’un sans son accord.',
          'L’éditeur peut supprimer tout contenu contraire à ces règles.',
        ],
      },
      {
        heading: 'Dépenses partagées',
        body: [
          'L’onglet Dépenses calcule des soldes et propose des remboursements à titre indicatif. Aucun paiement n’est encaissé, déclenché ni garanti par l’application : les remboursements se font entre les participants, par leurs propres moyens.',
          'En cas de désaccord sur un montant, le règlement se fait entre les personnes concernées ; l’éditeur n’intervient pas.',
        ],
      },
      {
        heading: 'Sécurité en montagne',
        body: [
          'ALTImates ne vous dit pas si une sortie est sûre. Les prévisions météo, les tracés, les temps de marche et les listes de matériel sont indicatifs et peuvent être faux.',
          'La décision de partir, le choix de l’itinéraire et l’équipement emporté relèvent de votre seule responsabilité, et de celle du groupe. Consultez les sources officielles avant chaque sortie.',
        ],
      },
      {
        heading: 'Évolution des conditions',
        body: [
          'Ces conditions peuvent être modifiées. La version en vigueur est celle affichée dans l’application, avec sa date de révision.',
        ],
      },
    ],
  },
]

/** Retrouve un document par son identifiant, sans jamais renvoyer undefined. */
export function findLegalDoc(id: LegalDoc['id']): LegalDoc {
  return LEGAL_DOCS.find((d) => d.id === id) ?? LEGAL_DOCS[0]
}
