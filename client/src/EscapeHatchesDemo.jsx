import { useEffect, useRef, useState } from "react";

function StateCounter() {
    const [count, setCount] = useState(0);

    function handleClick() {
        setCount(c => c + 1);
    }

    return (
        <button onClick={handleClick}>
            State count: {count}
        </button>
    );
}


function RefCounter() {
    const clicksRef = useRef(0);

    function handleClick() {
        clicksRef.current += 1;
        console.log("Ref count:", clicksRef.current);
    }

    return (
        <button onClick={handleClick}>
            Click and check the console
        </button>
    );
}


function FocusEmail() {
    const emailRef = useRef(null);

    return (
        <section>
            <input ref={emailRef} type="email"
                placeholder="Email address"
                aria-label="Email address" />
            <button onClick={() => emailRef.current?.focus()}>
                Focus email
            </button>
        </section>
    );
}


function Timer() {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const id = setInterval(() => {
            setSeconds(s => s + 1);
        }, 1000);
        return () => clearInterval(id);
    }, []);

    return <p>Seconds: {seconds}</p>;
}


export { FocusEmail, RefCounter, StateCounter, Timer };

