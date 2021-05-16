export async function mergeObject(...objArg): Promise<any> {
  // create a new object
  let target = {};
  // deep merge the object into the target object
  // iterate through all objects and
  // deep merge them with target
  for (let i = 0; i < objArg.length; i++) {
    for (let prop in objArg[i]) {
      if (objArg[i].hasOwnProperty(prop)) {
        if (
          Object.prototype.toString.call(objArg[i][prop]) === "[object Object]"
        ) {
          // if the property is a nested object
          target[prop] = await mergeObject(target[prop], objArg[i][prop]);
        } else {
          // for regular property
          target[prop] = objArg[i][prop];
        }
      }
    }
  }

  return target;
}
