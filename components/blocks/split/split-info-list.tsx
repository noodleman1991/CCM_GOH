import SplitInfoItem, { type SplitInfoItemFields } from "@/components/blocks/split/split-info-item";

interface SplitInfoListProps {
  list?: SplitInfoItemFields[] | null;
}

export default function SplitInfoList({ list }: SplitInfoListProps) {
  return (
    <div className="flex items-center justify-center">
      <div className="grid grid-cols-1 @content-md/page:grid-cols-2 @content-lg/page:grid-cols-1 gap-8">
        {list &&
          list.length > 0 &&
          list.map((item, index) => <SplitInfoItem key={index} {...item} />)}
      </div>
    </div>
  );
}
