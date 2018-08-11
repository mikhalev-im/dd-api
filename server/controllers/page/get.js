const { PRODUCTS } = require("../../constants/blocks");

module.exports = async (req, res, next) => {
  try {
    const { page, product } = req.app.models;

    const data = await page.findOne({
      where: { alias: req.params.alias }
    });

    // page not found -> 404
    if (!data) {
      res.status(404);
      return res.send({
        error: {
          statusCode: 404,
          name: "Not Found",
          message: "Page not found",
          code: "NOT_FOUND"
        }
      });
    }

    data.blocks = await Promise.all(
      data.blocks.map(async item => {
        if (item.type === PRODUCTS) {
          // populate products by block filter
          item.data = await product.find(item.filter);
        }

        return item;
      })
    );

    res.send(data);
  } catch (e) {
    next(e);
  }
};
