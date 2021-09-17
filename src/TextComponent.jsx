import React from "react";

export default function TextComponent(props) {
    const { name, label, placeholder, value, callback } = props;
    return <>
        <label htmlFor={name}>{label}</label>:
        <input type="text" value={value || ""} placeholder={placeholder} name={name} onChange={(e) => callback(e.target.value)} />
        <br />
    </>;
}