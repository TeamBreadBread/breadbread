import { useState } from "react";
import { FieldLabel, RadioRow } from "@/components/common";

export default function UserTypeSection() {
  const [selectedUserType, setSelectedUserType] = useState("빵빵 이용자");

  return (
    <section className="flex flex-col gap-x1_5">
      <FieldLabel>이용자 선택</FieldLabel>

      <div className="flex flex-col gap-x4 py-x2">
        <RadioRow
          label="빵빵 이용자"
          checked={selectedUserType === "빵빵 이용자"}
          onCheckedChange={() => setSelectedUserType("빵빵 이용자")}
        />
        <RadioRow
          label="빵집 사장님"
          checked={selectedUserType === "빵집 사장님"}
          onCheckedChange={() => setSelectedUserType("빵집 사장님")}
        />
        <RadioRow
          label="택시 기사님"
          checked={selectedUserType === "택시 기사님"}
          onCheckedChange={() => setSelectedUserType("택시 기사님")}
        />
      </div>
    </section>
  );
}
