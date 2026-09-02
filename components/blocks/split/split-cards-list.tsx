import SplitCardsItem, { type SplitCardItemFields } from "@/components/blocks/split/split-cards-item";

interface SplitCardsListProps {
  list?: SplitCardItemFields[] | null;
}

export default function SplitCardsList({ list }: SplitCardsListProps) {
  return (
    <div className="flex flex-col justify-center gap-6 @content-md/page:gap-8 @content-lg/page:gap-10">
      {list &&
        list.length > 0 &&
        list.map((item, index) => (
          <SplitCardsItem
            key={index}
            tagLine={item.tagLine}
            title={item.title}
            body={item.body}
          />
        ))}
    </div>
  );
}
