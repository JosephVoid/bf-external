interface ParsedResponse {
  category: string;
  title: string;
  user: string;
  price: number;
}

export function parseResponse(data: any): ParsedResponse[] {
  const ads: any[] = data.adverts_list.adverts;
  return ads.map((ad: any) => {
    return {
      category: ad.category_name,
      title: ad.title,
      price: ad.price_obj.value,
      user: ad.user_phone,
    };
  });
}

export function formatClean(data: ParsedResponse[]): ParsedResponse[] {
  const uniqueUsers = data.filter(
    (item, index, self) =>
      index === self.findIndex((obj) => obj.user === item.user)
  );

  return uniqueUsers.map((ad) => {
    return {
      ...ad,
      user: `+251${ad.user.slice(1)}`,
    };
  });
}

export function truncate(str: string, len: number): string {
  return `${str.slice(0, len - 3)}...`;
}
