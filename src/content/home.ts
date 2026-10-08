import galleryManifest from "./gallery.json";

export type GalleryImage = Readonly<{
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
}>;

const galleryImages: readonly GalleryImage[] = galleryManifest;

export const homeContent = {
  hero: {
    eyebrow: "MINECRAFT JAVA 26.3 / SURVIVAL SMP",
    description: "好きなことを、好きなペースで。",
    supportingText:
      "建築、探索、装置づくり。ひとりで黙々と遊ぶのも、みんなで何かを作るのも自由です。",
    primaryAction: "Discordに参加する",
    secondaryAction: "Celenasについて",
  },
  about: {
    title: "気軽に遊べて、長く続けられるSMP。",
    description:
      "Celenas SMPは、自分のペースを大切にしながら遊べるコミュニティです。",
    paragraphs: [
      "人それぞれの建築や探索を尊重し、ひとりで過ごす時間も、誰かと一緒に遊ぶ時間も大切にしています。遊び方やログイン頻度を合わせる必要はありません。",
      "それぞれが作ったものや過ごした時間がワールドに積み重なっていく。そんな場所を、みんなで長く育てていきます。",
    ],
    values: [
      "無理せず、自分のペースで",
      "人の建築や持ち物を大切に",
      "ひとりでも、みんなでも",
    ],
  },
  world: {
    title: "建築も、探索も、装置も。",
    description:
      "建築・探索・装置づくり。それぞれの楽しみ方を、ワールドの中で形にできます。",
    themes: [
      {
        number: "01",
        title: "BUILD / 建築",
        body: "拠点づくりから街づくり、巨大建築まで。規模もジャンルも自由です。",
      },
      {
        number: "02",
        title: "EXPLORE / 探索",
        body: "新しい地形や資源を探したり、遠くまで旅したり。気になる場所へ自由に出かけられます。",
      },
      {
        number: "03",
        title: "CREATE / ものづくり",
        body: "自動化装置や交通網、共有設備など。便利なものを作るのもCelenasの遊び方のひとつです。",
      },
    ],
  },
  community: {
    title: "参加・連絡はDiscordから。",
    description:
      "Discordを参加の窓口として、お知らせや質問・相談、プレイヤー同士の情報共有を行っています。参加申請もこちらからどうぞ。",
    note: "申請後の接続手順はDiscordで案内しています。サーバーアドレスはWebでは公開していません。",
  },
  rules: {
    title: "みんなで遊ぶためのルール。",
    description:
      "難しい決まりはありません。人の建築やアイテムを大切にして、困ったときは運営へ相談してください。",
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
    title: "ワールドの様子。",
    description: "建築、装置、風景など、ワールドで撮った写真を載せています。",
    pending: "まだ画像はありません。",
    emptyDescription: "ワールドのスクリーンショットをここに追加していきます。",
    images: galleryImages,
  },
  join: {
    title: "Celenas SMPに参加する",
    description: "Discordで申請し、承認後にMinecraftから参加できます。",
    steps: [
      {
        number: "01",
        title: "Discordに参加する",
        body: "Celenas SMPのDiscordコミュニティに参加します。",
      },
      {
        number: "02",
        title: "Minecraft IDで参加申請",
        body: "申請チャンネルでMinecraft IDを添えて申請します。",
      },
      {
        number: "03",
        title: "運営の承認後に接続",
        body: "承認後、案内された手順を確認してMinecraftから接続します。",
      },
    ],
  },
} as const;
