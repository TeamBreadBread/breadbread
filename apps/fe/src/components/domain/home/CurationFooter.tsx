import CurationCard from "./CurationCard";

type CurationItem = {
  title: string;
  address: string;
  rate: number;
};

type CurationFooterProps = {
  items?: CurationItem[];
};

const CurationFooter = ({
  items = [
    { title: "빵집 이름 1", address: "소제동", rate: 4.5 },
    { title: "빵집 이름 2", address: "소제동", rate: 4.8 },
    { title: "빵집 이름 3", address: "은행동", rate: 4.2 },
    { title: "빵집 이름 4", address: "대흥동", rate: 4.9 },
  ],
}: CurationFooterProps) => {
  return (
    <div className="w-full h-[364px] overflow-x-auto scrollbar-hide">
      <div className="flex gap-4 w-max">
        {items.map((item, index) => (
          <div key={index} className="flex-shrink-0 w-[254px] h-[240px]">
            <CurationCard title={item.title} address={item.address} rate={item.rate} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CurationFooter;
