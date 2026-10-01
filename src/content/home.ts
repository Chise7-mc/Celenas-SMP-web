export type GalleryImage = Readonly<{
  src: string;
  alt: string;
  caption: string;
  location?: string;
}>;

const galleryImages: readonly GalleryImage[] = [];

export const homeContent = {
  hero: {
    eyebrow: "Moonlit community",
    description: "Minecraft で、静かなつながりを育てる場所。",
    supportingText: "建築、探検、会話。それぞれの時間が重なる景色を目指して。",
    primaryAction: "参加案内を見る",
    secondaryAction: "Celenas を知る",
  },
  about: {
    title: "自分のペースで、同じ夜を過ごす。",
    description:
      "Celenas が目指すのは、夜空のように穏やかな時間が流れるコミュニティです。",
    paragraphs: [
      "ひとりで景色を眺める日も、誰かと何かをつくる日も。思い思いの時間が重なる場所を思い描いています。",
      "急がず、比べず。時間とともに育つ世界を思い描いています。",
    ],
    values: ["自分らしい過ごし方", "景色を育てる時間", "穏やかなつながり"],
  },
  world: {
    title: "まだ見ぬ景色の、その先へ。",
    description:
      "ここに並ぶのは、Celenas が思い描く世界のテーマ。実際のワールドの様子は、準備ができ次第ご紹介します。",
    themes: [
      {
        number: "01",
        title: "つくる",
        body: "小さなアイデアが、時間とともに景色へ変わっていく。",
      },
      {
        number: "02",
        title: "めぐる",
        body: "知らない場所へ歩き出し、自分だけの発見に出会う。",
      },
      {
        number: "03",
        title: "ともに",
        body: "それぞれの時間が重なり、ひとつの物語になっていく。",
      },
    ],
  },
  community: {
    title: "確かな情報だけを、ここに。",
    description:
      "接続情報や参加方法は、管理者による確認が済んだものだけを掲載します。",
    note: "公開前の情報は、未確定のままお知らせします。",
  },
  rules: {
    title: "サーバールール",
    description: "安心して参加いただけるよう、正式な内容を準備しています。",
    pending: "サーバールールは現在、管理者確認中です。",
  },
  gallery: {
    title: "Celenas の風景",
    description:
      "実際のワールドスクリーンショットを、確認でき次第ここに掲載します。",
    pending: "ワールドの写真は準備中です。",
    images: galleryImages,
  },
  join: {
    title: "参加案内",
    description: "準備が整い次第、確定した参加情報をこちらでお知らせします。",
  },
} as const;
