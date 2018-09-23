const app = require("../../server/server");

module.exports = function(Order) {
  Order.validatesInclusionOf("status", {
    in: ["needPayment", "paid", "sent", "completed", "cancelled"]
  });

  Order.getByUser = async options => {
    if (!options.accessToken || !options.accessToken.userId)
      throw new app.errors.Unauthorized("User id is required");

    return Order.find({
      where: { userId: options.accessToken.userId }
    });
  };

  Order.createFromCart = async (cartId, options) => {
    const { CART_DOES_NOT_EXIST, CART_IS_EMPTY } = app.errors.codes;

    if (!options.accessToken || !options.accessToken.userId)
      throw new app.errors.Unauthorized("User id is required");

    const Cart = app.models.cart;
    const cart = await Cart.findById(cartId);

    if (!cart)
      throw new app.errors.NotFound("Cart does not exist", CART_DOES_NOT_EXIST);
    if (!cart.items.length)
      throw new app.errors.BadRequest("Cart is empty", CART_IS_EMPTY);

    await cart.validateItems();

    const Product = app.models.product;
    const productCollection = app.dataSources.mongo.connector.collection(
      Product.modelName
    );

    await Promise.all(
      cart.items.map(async item => {
        await productCollection.update(
          {
            _id: item.id
          },
          {
            $inc: {
              qty: -item.qty,
              ordersNumber: item.qty
            },
            $set: {
              updatedTime: new Date()
            }
          }
        );
      })
    );

    const order = await Order.create({
      userId: options.accessToken.userId,
      status: "needPayment",
      items: cart.items,
      createdTime: new Date()
    });

    // reset cart
    await cart.updateAttributes({
      items: [],
      updatedTime: new Date()
    });

    return order;
  };

  Order.remoteMethod("getByUser", {
    description: "Lists user orders",
    accepts: [
      {
        arg: "options",
        type: "object",
        http: "optionsFromRequest"
      }
    ],
    returns: {
      arg: "orders",
      type: ["order"],
      description: "Array of user orders",
      root: true
    },
    http: {
      verb: "get",
      path: "/getByUser"
    }
  });

  Order.remoteMethod("createFromCart", {
    description: "Creates a new order from existing cart",
    accepts: [
      {
        arg: "cartId",
        type: "string",
        required: true,
        description: "Cart id"
      },
      {
        arg: "options",
        type: "object",
        http: "optionsFromRequest"
      }
    ],
    returns: {
      arg: "order",
      type: "order",
      description: "Order object",
      root: true
    },
    http: {
      verb: "post",
      path: "/createFromCart"
    }
  });
};
