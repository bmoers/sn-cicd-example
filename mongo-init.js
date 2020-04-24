db.createUser(
    {
        user: "cicd",
        pwd: "passwd",
        roles: [
            {
                role: "readWrite",
                db: "cicd"
            }
        ]
    }
);