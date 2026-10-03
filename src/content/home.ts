import galleryManifest from "./gallery.json";

export type GalleryImage = Readonly<{
  id: string;
  src: string;
  alt: string;
  caption: string;
  location?: string;
}>;

const galleryImages: readonly GalleryImage[] = galleryManifest;

export const homeContent = {
  hero: {
    eyebrow: "MINECRAFT JAVA 26.3 / SURVIVAL SMP",
    description: "それぞれのペースが、ひとつの世界をつくっていく。",
    supportingText:
      "建築、探索、装置づくり。ひとりで過ごす日も、誰かと進める日も。積み重ねた時間がCelenasの景色になります。",
    primaryAction: "Discord に参加する",
    secondaryAction: "Celenasについて",
  },
  about: {
    title: "自由に遊ぶ。ゆっくり世界を育てる。",
    description:
      "Celenas SMPは、Minecraft Java Edition 26.3のサバイバルをベースに、建築・探索・装置づくりを楽しむコミュニティです。",
    paragraphs: [
      "大きな建築に集中する日も、遠くまで探索する日も、何も決めずに世界を歩く日も。Celenasでは、遊び方や進める速さをひとつに決めません。",
      "ひとりでつくった拠点も、誰かと進めた装置や共同プロジェクトも、少しずつ同じ世界に積み重なっていきます。長く残る景色を、みんなでゆっくり育てていくSMPです。",
    ],
    values: [
      "自分のペースを尊重する",
      "つくったものを大切にする",
      "ひとりでも、誰かとでも",
    ],
  },
  world: {
    title: "建てる。探す。仕組みをつくる。",
    description:
      "Celenasの遊び方に決まった正解はありません。好きなことを、自分のペースで世界に積み重ねていけます。",
    themes: [
      {
        number: "01",
        title: "BUILD / 建築",
        body: "小さな拠点から街、巨大建築まで。時間をかけてつくったものが、少しずつCelenasの景色になっていきます。",
      },
      {
        number: "02",
        title: "EXPLORE / 探索",
        body: "まだ歩いたことのない場所へ。新しい地形や資源を探しながら、自分だけの発見を世界に増やしていきます。",
      },
      {
        number: "03",
        title: "CREATE / ものづくり",
        body: "便利な装置やインフラ、共同プロジェクトまで。アイデアを仕組みに変えて、世界を少しずつ便利にしていきます。",
      },
    ],
  },
  community: {
    title: "参加の入口は、Discordから。",
    description:
      "参加申請、サーバーからのお知らせ、情報共有はDiscordを中心に行います。ゲームの中でも外でも、自分に合った距離感でコミュニティに参加できます。",
    note: "Minecraftへの参加方法や必要な案内はDiscordで確認できます。Webサイトではサーバーアドレスを公開していません。",
  },
  rules: {
    title: "同じ世界で、気持ちよく遊ぶために。",
    description:
      "細かく縛るためではなく、長く同じ世界を楽しむための基本ルールです。",
    items: [
      {
        number: "01",
        title: "他の人のものを大切に",
        body: "他のプレイヤーの建築・装置・アイテムを、許可なく壊したり持ち出したりしないでください。",
      },
      {
        number: "02",
        title: "荒らし・嫌がらせは禁止",
        body: "意図的な破壊、妨害、迷惑行為、過度な煽りや嫌がらせなど、他の人が遊びにくくなる行為は禁止です。",
      },
      {
        number: "03",
        title: "不正なプレイをしない",
        body: "チート、不正クライアント、運営が認めていない意図的なバグ悪用など、公平性を大きく損なう行為は禁止です。",
      },
      {
        number: "04",
        title: "PvPは相手の同意を",
        body: "通常時のPvPや他プレイヤーへの攻撃は、お互いが了承している場合に行ってください。イベント時はそのイベントのルールを優先します。",
      },
      {
        number: "05",
        title: "大規模な装置は周囲に配慮",
        body: "大規模装置やサーバー負荷の高い設備をつくる場合は、周囲への影響を確認し、必要に応じて運営へ相談してください。",
      },
      {
        number: "06",
        title: "困ったときは運営へ",
        body: "トラブルや判断に迷うことがあれば、当事者同士で無理に解決せずDiscordから運営へ相談してください。",
      },
    ],
    footnote:
      "状況に応じてルールを追加・調整する場合があります。重要な変更はDiscordでお知らせします。",
  },
  gallery: {
    title: "積み重なった景色を、記録する。",
    description:
      "建築、風景、装置、旅の途中で見つけた瞬間。Celenasの世界に残ったものを、少しずつここへ記録していきます。",
    pending: "最初の記録を準備しています。",
    images: galleryImages,
  },
  join: {
    title: "Celenas SMPに参加する。",
    description:
      "Celenas SMPはMinecraft Java Edition 26.3で運用しています。参加申請や参加に必要な案内はDiscordから確認できます。",
  },
} as const;
