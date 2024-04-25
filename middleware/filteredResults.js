const filteredResults = async (req, res, next) => {
    let {select, sort, page = 1, limit = 10, json, ...filters} = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    json = json.filter(item => {
        for (let key in filters) {
            if (item[key] !== undefined && item[key].toString() !== filters[key]) {
                return false;
            }
        }
        return true;
    });

    if (select) {
        const fields = select.split(',');
        json = json.map(item => {
            const selectedItem = {};
            fields.forEach(field => {
                if (item.hasOwnProperty(field)) {
                    selectedItem[field] = item[field];
                }
            });
            return selectedItem;
        });
    }

    if (sort) {
        const sortFields = sort.split(',').map(field => {
            return field.startsWith('-') ? [field.slice(1), -1] : [field, 1];
        });

        json.sort((a, b) => {
            for (let [field, order] of sortFields) {
                if (a[field] < b[field]) return order * -1;
                if (a[field] > b[field]) return order;
            }
            return 0;
        });
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = json.length;
    const paginatedItems = json.slice(startIndex, endIndex);

    const pagination = {};
    if (endIndex < total) {
        pagination.nextPage = page + 1;
    }
    if (startIndex > 0) {
        pagination.prevPage = page - 1;
    }

    res.status(200).json({
        success: true, count: paginatedItems.length, pagination, results: paginatedItems,
    });
};

module.exports = filteredResults;
