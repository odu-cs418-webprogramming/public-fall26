function UserInfo({ name, course, children }) {
    return (
        <div>
            {/* <h4>Name: {props.name}</h4>
            <h5>Course: {props.course}</h5>
            <p>{props.children}</p> */}

            <h4>Name: {name}</h4>
            <h5>Course: {course}</h5>
            <p>{children}</p>

        </div>
    )
}

export default UserInfo