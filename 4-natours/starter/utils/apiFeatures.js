// Class 96 fix: Two-digit filter works only for the first digit
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // ----- Build query, basic filtering and advanced filtering
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // --- 1. Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    // eslint-disable-next-line no-console
    // console.log(this.query, this.queryStr);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  // --- 2. Sorting
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      // ** Update sort conditions
      /*
      The course originally asked to sort only using '-createdAt'.
      This breaks the skip().limit() query chaining ahead
      when no sorting is applied,
      because there are documents that were created with the same date
      */
      this.query = this.query.sort('-createdAt _id');
    }
    return this;
  }

  limitFields() {
    // --- 3. Field limiting
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      // ** Update selected fields conditions
      this.query = this.query.select(fields);
    } else {
      // ** Update to remove unused '__v' field:
      /* The '__v' field is automatically generated by MongoDB so,
            When there is no selected fields, we have to remove it.
            */
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    // --- 4. Pagination
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    // ** Update pagination conditions (page, limit)
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}
module.exports = APIFeatures;
