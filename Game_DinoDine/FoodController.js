import Food from "./Food.js";

export default class FoodController {
  FOOD_INTERVAL_MIN = 500;
  FOOD_INTERVAL_MAX = 2000;

  nextFoodInterval = null;
  foods = [];

  constructor(ctx, foodImages, scaleRatio, speed) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.foodImages = foodImages;
    this.scaleRatio = scaleRatio;
    this.speed = speed;

    this.setNextFoodTime();
  }

  setNextFoodTime() {
    const num = this.getRandomNumber(
      this.FOOD_INTERVAL_MIN,
      this.FOOD_INTERVAL_MAX
    );

    this.nextFoodInterval = num;
  }

  getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  createFood() {
    const index = this.getRandomNumber(0, this.foodImages.length - 1);
    const foodsImage = this.foodImages[index];
    const x = this.canvas.width * 1.5;
    const y = this.canvas.height - foodsImage.height;
    const food = new Food(
      this.ctx,
      x,
      y,
      foodsImage.width,
      foodsImage.height,
      foodsImage.image
    );

    this.foods.push(food);
  }

  update(gameSpeed, frameTimeDelta) {
    if (this.nextFoodInterval <= 0) {
      this.createFood();
      this.setNextFoodTime();
    }
    this.nextFoodInterval -= frameTimeDelta;

    this.foods.forEach((food) => {
      food.update(this.speed, gameSpeed, frameTimeDelta, this.scaleRatio);
    });

    this.foods = this.foods.filter((food) => food.x > -food.width);
  }

  draw() {
    this.foods.forEach((food) => food.draw());
  }

  collideWith(sprite) {
    for (const food of this.foods) {
      if (food.collideWith(sprite)) {
        return food; // Return the specific food only on collision
      }
    }
    return null; // No collision
  }

  getClosestFood(playerX) {
    let closestFood = null;
    let minDistance = Infinity;

    for (const food of this.foods) {
      const distance = food.x - playerX;
      if (distance > 0 && distance < minDistance) {
        closestFood = food;
        minDistance = distance;
      }
    }

    return closestFood;
  }

  reset() {
    this.foods = [];
  }
}
