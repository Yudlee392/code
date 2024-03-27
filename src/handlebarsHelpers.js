const helpers = {
    eq: function (a, b) {
        return a === b;
    },
    formatDateForView: (date) => {
        return date.toLocaleDateString('vi-VN', { year: 'numeric', month: 'numeric', day: 'numeric'});
    },
    formatDateForEdit: function(dateString) {
        // Ensure dateString is provided and is a string
        // if (!dateString || typeof dateString !== 'string') {
        //     return 'abc';
        // }
        // console.log(dateString);
        
        // Create a new Date object from the dateString
        const date = new Date(dateString);
        
        // Get the year, month, and day from the date object
        const year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();

        // Prefix single-digit month and day with '0' if necessary
        month = month < 10 ? '0' + month : month;
        day = day < 10 ? '0' + day : day;
        
        // Return the formatted date in yyyy-mm-dd format
        return `${year}-${month}-${day}`;
    },
    check: function(v1, v2) {
        if (v1 === v2) {
            console.log('ifcond',v1)
            return "selected"
        }
        return "";
    }
    

};
module.exports = helpers;
