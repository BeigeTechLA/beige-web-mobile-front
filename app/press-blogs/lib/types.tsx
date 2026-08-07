export interface PostMeta {
  meta_key: string;
  meta_value: string | number | object;
}

export interface BlogPost {
  title: string;
  link: string;
  pubDate: string;
  post_date?: string;
  creator?: string;
  post_id: number | string;
  post_name: string | number;
  post_type: string;
  "content:encoded": string;
  category?: {
    title: string;
    "@_domain"?: string;
    "@_nicename"?: string;
  };
  postmeta?: PostMeta[];
}

export interface BlogData {
  item: BlogPost[];
}