import React from 'react';
import Lottie from 'react-lottie';
import type { AnimationLottieProps } from './types';

const AnimationLottie: React.FC<AnimationLottieProps> = ({ animationData, height = 100, width = 100 }) => {
    
    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: animationData,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice'
        }
    };

    return (<Lottie
                options={defaultOptions}
                height={height}
                width={width}
            />);
}

export default AnimationLottie;
