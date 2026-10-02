export type GalleryImage = Readonly<{
  src: string;
  alt: string;
  caption: string;
  location?: string;
}>;

const galleryImages: readonly GalleryImage[] = [];

export const homeContent = {
  hero: {
    eyebrow: "A MINECRAFT SURVIVAL COMMUNITY",
    description: "ひとつのMinecraft世界を、みんなで少しずつ育てていく。",
    supportingText:
      "建築も探索も、自分のペースで。過ごした時間がCelenasの景色になります。",
    primaryAction: "参加方法を見る",
    secondaryAction: "Celenasについて",
  },
  about: {
    title: "Minecraftサバイバルを、それぞれのペースで。",
    description:
      "Celenas SMPは、Minecraftサバイバルをベースに、建築・探索・装置づくりを楽しめるコミュニティを目指しています。",
    paragraphs: [
      "ひとりで建築に没頭する日も、まだ見ぬ場所へ探索に出る日も。誰かと過ごすことを急かさず、それぞれが好きな遊び方で世界に関われる場所を目指します。",
      "装置づくりや共同プロジェクトも、それぞれの関心やタイミングに合わせて。積み重ねた建築や道が、いつかCelenasの風景になっていきます。",
    ],
    values: [
      "自分のペースで過ごす",
      "世界に残る足跡",
      "ひとりでも、誰かとでも",
    ],
  },
  world: {
    title: "建築する。探索する。つくり上げる。",
    description:
      "小さな拠点づくりから遠くへの探索まで。Celenasで大切にしたい、Minecraftサバイバルの楽しみ方です。",
    themes: [
      {
        number: "01",
        title: "BUILD / 建築",
        body: "小さな拠点から街並みまで。時間をかけてつくったものが、世界の景色になっていきます。",
      },
      {
        number: "02",
        title: "EXPLORE / 探索",
        body: "まだ歩いたことのない土地へ。資源を探したり、新しい景色に出会ったり。",
      },
      {
        number: "03",
        title: "CREATE / ものづくり",
        body: "装置づくりや共同プロジェクトも、それぞれのアイデアを少しずつ形にする楽しみ方のひとつです。",
      },
    ],
  },
  community: {
    title: "ゲームの中でも、Discordでも。",
    description:
      "Minecraftで遊ぶ時間も、Discordでの会話や情報共有も。ゲームの中と外のどちらでも、自分に合った距離感でつながれる場所を目指しています。",
    note: "Discordの案内と接続情報は、確認できたものから掲載します。",
  },
  rules: {
    title: "世界を長く楽しむためのルール。",
    description:
      "誰かがつくったものを尊重し、安心して長く遊べる世界を保つための約束を準備しています。",
    pending: "正式なルールは準備中です。確定した内容をこちらに掲載します。",
  },
  gallery: {
    title: "Celenasに残る景色。",
    description:
      "建築、風景、旅の途中の何気ない瞬間。これからCelenasの世界に残る記録を、公開できるものから集めていきます。",
    pending: "景色の記録は準備中です。",
    images: galleryImages,
  },
  join: {
    title: "Celenas SMPに参加する。",
    description:
      "Minecraftの対応バージョンやサーバーアドレス、Discordなど、参加に必要な情報を確認でき次第ここに掲載します。",
  },
} as const;
