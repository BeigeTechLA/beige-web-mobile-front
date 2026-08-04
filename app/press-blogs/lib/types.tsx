export interface PostMeta {
  "wp:meta_key": string;
  "wp:meta_value": string | number | object;
}

export interface BlogPost {
  title: string;
  link: string;
  pubDate: string;
  "wp:post_id": number | string;
  "wp:post_name": string | number;
  "wp:post_type": string;
  "content:encoded": string;
  category?: {
    "#text": string;
    "@_domain": string;
    "@_nicename": string;
  };
  "wp:postmeta"?: PostMeta[];
}

export interface BlogData {
  rss: {
    channel: {
      title: string;
      item: BlogPost | BlogPost[];
    };
  };
}