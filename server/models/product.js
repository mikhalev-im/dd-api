module.exports = function(Product) {
  Product.getApp((err, app) => {
    Product.random = async (count = 1) => {
      return new Promise((resolve, reject) => {
        if (typeof count !== "number" || count > 50) {
          reject(new Error("Product.random: invalid `count` parameter"));
        }

        const productCollection = app.dataSources.mongo.connector.collection(
          Product.modelName
        );

        productCollection.aggregate(
          [
            { $sample: { size: count } },
            { $addFields: { id: "$_id" } },
            { $project: { _id: 0 } }
          ],
          async (err, cursor) => {
            if (err) reject(err);
            const items = await cursor.toArray();
            resolve(items);
          }
        );
      });
    };
  });

  Product.remoteMethod("random", {
    description: "Returns random documents from db",
    accepts: {
      arg: "count",
      type: "number",
      default: 1,
      description: "Number of documents to return"
    },
    returns: {
      arg: "products",
      type: ["product"],
      description: "Array of random documents",
      root: true
    },
    http: {
      verb: "get",
      path: "/random"
    }
  });
};
