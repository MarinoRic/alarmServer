function getAuthorization(roles) {
    return (req, res, next) => {
        const {role} = {...req.user};

        console.log(roles);

          if (!roles.includes(role)) {
              return next(new Error(`User not authorized to access this route`));
          }

        next();
    }
}

module.exports = getAuthorization;