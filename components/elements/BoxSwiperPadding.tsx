import { useEffect, useState } from "react";

const SwiperPadding: React.FC = () => {
    const [leftPadding, setLeftPadding] = useState(0);

    useEffect(() => {
        const updatePadding = () => {
            const swipperRoot = document.querySelector(".swipper-root") as HTMLElement | null;
            let padding = 0;

            if (swipperRoot) {
                padding = swipperRoot.getBoundingClientRect().left;
            }

            const boxSwiperPadding = document.querySelector(".box-swiper-padding") as HTMLElement | null;
            if (boxSwiperPadding) {
                boxSwiperPadding.style.paddingLeft = `${padding}px`;
            }

            setLeftPadding(padding);
        };

        updatePadding();
        window.addEventListener("resize", updatePadding);

        return () => {
            window.removeEventListener("resize", updatePadding);
        };
    }, []);

    return null;
};

export default SwiperPadding;
