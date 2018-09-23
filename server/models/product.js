const app = require("../../server/server");

module.exports = function(Product) {
  Product.random = async (count = 1) => {
    return new Promise((resolve, reject) => {
      if (typeof count !== "number" || count > 50) {
        reject(new app.errors.BadRequest("Invalid `count` parameter"));
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

  Product.getTags = async () => {
    const productCollection = app.dataSources.mongo.connector.collection(
      Product.modelName
    );
    return productCollection.distinct("tags");
  };

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

  Product.remoteMethod("getTags", {
    description: "Returns tags options from db",
    returns: {
      arg: "tags",
      type: ["string"],
      description: "Array of all possible tags",
      root: true
    },
    http: {
      verb: "get",
      path: "/getTags"
    }
  });
};
