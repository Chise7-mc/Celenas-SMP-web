export type GalleryImage = Readonly<{
  src: string;
  alt: string;
  caption: string;
  location?: string;
}>;

const galleryImages: readonly GalleryImage[] = [];

export const homeContent = {
  hero: {
    eyebrow: "A world, over time",
    description: "ひとつの世界を、時間をかけて育てていく。",
    supportingText:
      "Minecraftで、建築も探索も会話も。それぞれの時間が、ひとつの景色になる。",
    primaryAction: "参加方法を見る",
    secondaryAction: "Celenasについて",
  },
  about: {
    title: "過ごした時間が、世界に残っていく。",
    description:
      "Celenas SMPは、Minecraftのひとつの世界を長く共有していくコミュニティを目指しています。",
    paragraphs: [
      "決まった遊び方に急かされず、自分のペースで建てる、歩く、立ち止まる。一人で過ごす時間も、誰かと同じ景色をつくる時間も。",
      "積み重ねた建築や道、ふとした会話が世界の一部になる。戻ってくるたび、そこに過ごした時間を見つけられる場所を目指します。",
    ],
    values: [
      "自分のペースで過ごす",
      "世界に残る足跡",
      "ひとりでも、誰かとでも",
    ],
  },
  world: {
    title: "建てる。歩く。世界を重ねる。",
    description:
      "Minecraftの中で生まれる景色や発見。Celenasで大切にしたい楽しみ方を、実際のワールド情報と分けて紹介します。",
    themes: [
      {
        number: "01",
        title: "建築を重ねる",
        body: "小さな場所から、時間をかけて自分の景色をつくる。",
      },
      {
        number: "02",
        title: "知らない場所へ",
        body: "遠くまで歩き、まだ見ぬ地形や景色に出会う。",
      },
      {
        number: "03",
        title: "世界をつなぐ",
        body: "道や建築、ひとりひとりの工夫が、世界の輪郭を描いていく。",
      },
    ],
  },
  community: {
    title: "ひとりの夜にも、誰かと過ごす夜にも。",
    description:
      "ゲームの中で自分のペースを保つことも、Discordや会話から誰かと景色を分かち合うことも。それぞれの距離感が並ぶ場所を目指しています。",
    note: "Discordの案内と接続情報は、確認できたものから掲載します。",
  },
  rules: {
    title: "長く続く世界のための約束。",
    description:
      "みんながそれぞれの時間を重ねていけるよう、Celenasの約束を準備しています。",
    pending: "正式なルールは準備中です。確定した内容をこちらに掲載します。",
  },
  gallery: {
    title: "Celenasに残る景色。",
    description:
      "建築や旅の途中に出会った風景を、確認できたものから記録していきます。",
    pending: "景色の記録は準備中です。",
    images: galleryImages,
  },
  join: {
    title: "この世界に加わる。",
    description:
      "参加方法と接続先は、確かな情報を確認でき次第ここに掲載します。",
  },
} as const;
