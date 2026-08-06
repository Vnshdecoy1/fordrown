import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg
      fill="none"
      height={props.height ?? 16}
      viewBox="0 0 32 32"
      width={props.width ?? 16}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M17.959 8.62574C18.3494 8.23532 18.9825 8.23554 19.373 8.62574L26.04 15.2927L26.1064 15.366C26.2522 15.5439 26.333 15.7678 26.333 15.9998C26.3329 16.2649 26.2275 16.5193 26.04 16.7068L19.373 23.3728C18.9825 23.7632 18.3495 23.7633 17.959 23.3728C17.569 22.9823 17.5688 22.3491 17.959 21.9587L22.9189 16.9998H6.66602C6.11414 16.9994 5.66619 16.5517 5.66602 15.9998C5.66602 15.4477 6.11403 15.0001 6.66602 14.9998H22.9189L17.959 10.0398C17.5689 9.64936 17.5689 9.01618 17.959 8.62574Z"
        fill={props.color ?? "#F7F9FA"}
      />
    </svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg
      fill="none"
      height={props.height ?? 16}
      viewBox="0 0 32 32"
      width={props.width ?? 16}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12.627 8.62574C13.0175 8.23554 13.6506 8.23532 14.041 8.62574C14.4311 9.01618 14.4311 9.64936 14.041 10.0398L9.08105 14.9998H25.334C25.886 15.0001 26.334 15.4477 26.334 15.9998C26.3338 16.5517 25.8859 16.9994 25.334 16.9998H9.08105L14.041 21.9587C14.4312 22.3491 14.431 22.9823 14.041 23.3728C13.6505 23.7633 13.0175 23.7632 12.627 23.3728L5.95996 16.7068C5.7725 16.5193 5.66708 16.2649 5.66699 15.9998C5.66699 15.7678 5.74782 15.5439 5.89355 15.366L5.95996 15.2927L12.627 8.62574Z"
        fill={props.color ?? "#A0A9BE"}
      />
    </svg>
  );
}

export function TrendingIcon(props: IconProps) {
  return (
    <svg
      fill="none"
      height={props.height ?? 13}
      viewBox="0 -0.5 13 8"
      width={props.width ?? 13}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M11.9583 0.625L7.29167 5.29167L4.625 2.625L0.625 6.625"
        stroke={props.color ?? "#92D1FF"}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
      <path
        d="M9.95833 0.625H11.9583V2.625"
        stroke={props.color ?? "#92D1FF"}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
    </svg>
  );
}

export function TopMoversIcon(props: IconProps) {
  return (
    <svg
      fill="none"
      height={props.height ?? 14}
      viewBox="0 0 11 14"
      width={props.width ?? 11}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M5.11548 12.3962C2.61364 12.3962 0.625 11.0883 0.625 7.81854C0.625 4.54875 3.83248 4.54875 3.83248 0.625C5.75698 1.93292 6.63583 3.30623 7.03997 5.85666C7.6921 5.38813 8.14953 4.68865 8.32296 3.89479C8.96446 4.54875 9.60596 6.51062 9.60596 7.81854C9.60596 9.87196 8.78484 12.3962 5.11548 12.3962Z"
        stroke={props.color ?? "#A0A9BE"}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg
      data-custom="true"
      width={props.width ?? 16}
      height={props.height ?? 16}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M10 12L6.17678 8.17678C6.07915 8.07915 6.07915 7.92085 6.17678 7.82322L10 4"
        stroke={props.color ?? "#A0A9BE"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg
      data-custom="true"
      width={props.width ?? 20}
      height={props.height ?? 20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8.75 3.125C11.8566 3.125 14.375 5.64344 14.375 8.75C14.375 11.8566 11.8566 14.375 8.75 14.375C5.64344 14.375 3.125 11.8566 3.125 8.75C3.125 5.64344 5.64344 3.125 8.75 3.125Z"
        stroke={props.color ?? "#A0A9BE"}
        strokeWidth="1.5"
      />
      <path
        d="M13.75 13.75L17.5 17.5"
        stroke={props.color ?? "#A0A9BE"}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg
      width={props.width ?? 24}
      height={props.height ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 5V19M5 12H19"
        stroke={props.color ?? "#A0A9BE"}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
