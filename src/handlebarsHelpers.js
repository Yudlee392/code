const helpers = {
  eq: function (a, b) {
    return a === b;
  },
  formatDateForView: (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  },
  formatDateForEdit: function (dateString) {
    const date = new Date(dateString);

    // Get the year, month, and day from the date object
    const year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    // Prefix single-digit month and day with '0' if necessary
    month = month < 10 ? "0" + month : month;
    day = day < 10 ? "0" + day : day;

    // Return the formatted date in yyyy-mm-dd format
    return `${year}-${month}-${day}`;
  },
  ifEquals: function (arg1, arg2, options) {
    // console.log('arg1',arg1,'arg2',arg2,arg1 == arg2 )
    try {
      if (arg1.toString() == arg2.toString()) {
        return options.fn(this);
      }
    } catch {
      return options.inverse(this);
    }
  },
  isBeforeFinalClosureDate: function (finalClosureDate) {
    const currentDate = new Date();
    return currentDate < finalClosureDate;
  },
  notOlderThanFourteenDays: function (dateSubmitted) {
    const eighteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    // Set time to midnight for both dates
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const submittedDate = new Date(dateSubmitted);
    submittedDate.setHours(0, 0, 0, 0);
    return submittedDate >= eighteenDaysAgo;
  },
  json: function (context) {
    return JSON.stringify(context);
  },
};
module.exports = helpers;
