const app = require("../../server/server");

module.exports = function(Cart) {
  Cart.prototype.populateItems = async function() {
    const Product = app.models.product;

    const productIds = this.items.map(item => item.productId);
    const products = await Product.find({
      where: {
        _id: { inq: productIds }
      }
    });

    this.items = this.items.map(item => {
      item.product = products.find(
        product => product.id.toString() === item.productId.toString()
      );
      return item;
    });
  };

  Cart.prototype.validateItems = async function() {
    await this.populateItems();

    const result = this.items.every(item => {
      if (!item.product) throw new app.errors.NotFound("Product not found");
      return item.qty < item.product.qty;
    });

    if (!result)
      throw new app.errors.BadRequest("Not enough products in stock");

    return true;
  };

  Cart.add = async (productId, qty = 1, cartId = null) => {
    // validate that product exists and qty > 0
    const Product = app.models.product;
    const product = await Product.findOne({
      where: {
        _id: productId,
        qty: { gt: 0 }
      }
    });

    if (!product)
      throw new app.errors.NotFound("Product does not exist or out of stock");

    // qty should be a number and bigger than 0
    if (typeof qty != "number" || qty < 1)
      throw new app.errors.BadRequest("Invalid qty parameter provided");

    let cart;
    // if there is cart id - try to find a cart
    if (cartId) {
      cart = await Cart.findById(cartId);
    }

    // if cart doesn't exist or there is no cartId -> create new cart
    if (!cart) {
      return Cart.create({ items: [{ productId, qty }] });
    }

    // check if product already in cart
    const cartItem = cart.items.find(item => item.productId === productId);
    if (cartItem) {
      cartItem.qty += qty;
    } else {
      // add product to cart
      cart.items = [...cart.items, { productId, qty }];
    }

    await cart.updateAttributes({
      items: cart.items,
      updatedTime: new Date()
    });
    await cart.populateItems();

    return cart;
  };

  Cart.removeProduct = async (cartId, productId) => {
    const { CART_DOES_NOT_EXIST } = app.errors.codes;

    const cart = await Cart.findById(cartId);
    if (!cart)
      throw new app.errors.NotFound("Cart does not exist", CART_DOES_NOT_EXIST);

    cart.items = cart.items.filter(item => item.productId !== productId);

    await cart.updateAttributes({
      items: cart.items,
      updatedTime: new Date()
    });
    await cart.populateItems();
    return cart;
  };

  Cart.get = async id => {
    const { CART_DOES_NOT_EXIST } = app.errors.codes;
    const cart = await Cart.findById(id);
    if (!cart)
      throw new app.errors.NotFound("Cart does not exist", CART_DOES_NOT_EXIST);

    await cart.populateItems();

    return cart;
  };

  Cart.bulkQtyUpdate = async (cartId, items) => {
    const { CART_DOES_NOT_EXIST } = app.errors.codes;

    const cart = await Cart.findById(cartId);
    if (!cart)
      throw new app.errors.NotFound("Cart does not exist", CART_DOES_NOT_EXIST);

    cart.items = cart.items.map(item => {
      const itemFromRequest = items.find(
        ({ productId }) => productId === item.productId
      );
      if (itemFromRequest) item.qty = itemFromRequest.qty;
      return item;
    });

    await cart.updateAttributes({
      items: cart.items,
      updatedTime: new Date()
    });
    await cart.populateItems();
    return cart;
  };

  Cart.remoteMethod("add", {
    description: "Adds an item to the cart",
    accepts: [
      {
        arg: "productId",
        type: "string",
        required: true,
        description: "Product id to add to cart"
      },
      {
        arg: "qty",
        type: "number",
        required: true,
        default: 1,
        description: "Quantity of the product to add to cart."
      },
      {
        arg: "cartId",
        type: "string",
        required: false,
        description:
          "Cart id to add product to. If it is not provided new cart will be created."
      }
    ],
    returns: {
      arg: "cart",
      type: "cart",
      description: "Updated cart",
      root: true
    },
    http: {
      verb: "post",
      path: "/add"
    }
  });

  Cart.remoteMethod("removeProduct", {
    description: "Removes product from cart",
    accepts: [
      {
        arg: "cartId",
        type: "string",
        required: true,
        description: "Cart id to remove product from"
      },
      {
        arg: "productId",
        type: "string",
        required: true,
        description: "Product id to remove from cart"
      }
    ],
    returns: {
      arg: "cart",
      type: "cart",
      description: "Cart object",
      root: true
    },
    http: {
      verb: "delete",
      path: "/:cartId/:productId",
      http: { source: "path" }
    }
  });

  Cart.remoteMethod("get", {
    description: "Returns cart object with populated products",
    accepts: [
      {
        arg: "id",
        type: "string",
        required: true,
        description: "Cart id"
      }
    ],
    returns: {
      arg: "cart",
      type: "cart",
      description: "Cart object",
      root: true
    },
    http: {
      verb: "get",
      path: "/:id",
      http: { source: "path" }
    }
  });

  Cart.remoteMethod("bulkQtyUpdate", {
    description: "Updates product quantaties in the cart",
    accepts: [
      {
        arg: "id",
        type: "string",
        required: true,
        description: "Cart id"
      },
      {
        arg: "items",
        type: ["object"],
        required: true,
        description: "Array of items to update"
      }
    ],
    returns: {
      arg: "cart",
      type: "cart",
      description: "Cart object",
      root: true
    },
    http: {
      verb: "patch",
      path: "/:id",
      http: { source: "path" }
    }
  });
};
