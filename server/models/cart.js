module.exports = function(Cart) {
  Cart.add = async (cartId, productId, qty = 1) => {
    // validate that product exists

    // qty should be a number and bigger than 0

    let cart;
    // if there is cart id - try to find a cart
    if (cartId) {
      cart = await Cart.findById(cartId);
    }

    // if cart doesn't exist or there is no cartId -> create new cart
    if (!cart) {
      cart = await Cart.create({
        items: []
      });
    }

    // add product to cart
    await cart.updateAttribute("items", [...cart.items, { productId, qty }]);
    return cart;
  };

  setTimeout(() => Cart.add("5b6dd25b85738b3180629d7a", "123", 1), 2000);
};
