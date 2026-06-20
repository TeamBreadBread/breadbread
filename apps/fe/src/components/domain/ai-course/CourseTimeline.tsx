import { Reorder, useDragControls, type DragControls } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import CourseTimelineItem from "./CourseTimelineItem";
import type { CoursePlace } from "./types";

interface CourseTimelineProps {
  places: CoursePlace[];
  onPlaceClick?: (place: CoursePlace) => void;
  canReorder?: boolean;
  reorderBusy?: boolean;
  onReorderPlaces?: (places: CoursePlace[]) => void;
}

function DragHandle({
  label,
  controls,
  disabled,
}: {
  label: string;
  controls: DragControls;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={`${label} 순서 변경`}
      disabled={disabled}
      onPointerDown={(event) => {
        event.stopPropagation();
        if (disabled) return;
        controls.start(event);
      }}
      className="absolute right-x2 top-x2 z-[1] flex h-x6 w-x6 touch-none items-center justify-center rounded-r2 text-gray-500 disabled:opacity-40"
    >
      <span className="flex flex-col gap-[3px]" aria-hidden>
        <span className="block h-[2px] w-[14px] rounded-full bg-gray-400" />
        <span className="block h-[2px] w-[14px] rounded-full bg-gray-400" />
        <span className="block h-[2px] w-[14px] rounded-full bg-gray-400" />
      </span>
    </button>
  );
}

function SortableTimelineItem({
  place,
  index,
  onPlaceClick,
  canReorder,
  reorderBusy,
  onDragStart,
  onDragEnd,
}: {
  place: CoursePlace;
  index: number;
  onPlaceClick?: (place: CoursePlace) => void;
  canReorder: boolean;
  reorderBusy: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={place}
      dragListener={false}
      dragControls={dragControls}
      drag={canReorder && !reorderBusy}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="relative z-0 list-none"
      whileDrag={{ zIndex: 10, scale: 1.02 }}
    >
      <CourseTimelineItem
        index={index}
        place={place}
        onClick={onPlaceClick ? () => onPlaceClick(place) : undefined}
        canReorder={canReorder}
        reorderBusy={reorderBusy}
        dragHandle={
          canReorder ? (
            <DragHandle label={place.name} controls={dragControls} disabled={reorderBusy} />
          ) : null
        }
      />
    </Reorder.Item>
  );
}

export default function CourseTimeline({
  places,
  onPlaceClick,
  canReorder = false,
  reorderBusy = false,
  onReorderPlaces,
}: CourseTimelineProps) {
  const [orderedPlaces, setOrderedPlaces] = useState(places);
  const orderBeforeDragRef = useRef<string[]>([]);

  useEffect(() => {
    setOrderedPlaces(places);
  }, [places]);

  const handleDragStart = () => {
    orderBeforeDragRef.current = orderedPlaces.map((place) => place.id);
  };

  const handleDragEnd = () => {
    const nextIds = orderedPlaces.map((place) => place.id);
    const changed = nextIds.some((id, index) => id !== orderBeforeDragRef.current[index]);
    if (changed) {
      onReorderPlaces?.(orderedPlaces);
    }
  };

  const timelineLine = (
    <div className="absolute bottom-0 left-[39px] top-0 w-[2px] bg-[#f3f4f5]" aria-hidden />
  );

  if (!canReorder) {
    return (
      <section className="relative px-x5 py-x3">
        {timelineLine}
        <div className="flex flex-col gap-x3">
          {places.map((place, idx) => (
            <CourseTimelineItem
              key={place.id}
              index={idx + 1}
              place={place}
              onClick={onPlaceClick ? () => onPlaceClick(place) : undefined}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="relative px-x5 py-x3">
      {timelineLine}
      <Reorder.Group
        axis="y"
        layoutScroll
        values={orderedPlaces}
        onReorder={setOrderedPlaces}
        className="flex flex-col gap-x3"
      >
        {orderedPlaces.map((place, idx) => (
          <SortableTimelineItem
            key={place.id}
            place={place}
            index={idx + 1}
            onPlaceClick={onPlaceClick}
            canReorder={canReorder}
            reorderBusy={reorderBusy}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        ))}
      </Reorder.Group>
    </section>
  );
}
