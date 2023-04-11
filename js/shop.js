const cart_items = localforage.createInstance({ name: "cart_items" });
const formatter = new Intl.NumberFormat('nl-BE', {
  style: 'currency',
  currency: 'EUR',
});

document.addEventListener('DOMContentLoaded', () => {
  bulmaQuickview.attach();

  fetch('/data.json')
  .then(r => r.json())
  .then(items => {
    printItems(items)

    document.getElementById('zoeken').addEventListener('keyup', e => {
      let value = e.target.value

      if (value !== '') {
        let results = fuzzysort.go(value, items, {
          threshold: -10000,
          key: 'Name'
        })
        printItems(results)
      } else {
        printItems(items)
      }
    })
  });

  document.getElementById('winkelwagen-levermethode').addEventListener('change', () => { printCartItems(); })
  document.getElementById('winkelwagen-form').addEventListener('submit', e => {
    e.preventDefault();

    let fd = new FormData(e.target);
    let json = {form: 'shop', items: []};
    for (let [key, value] of fd.entries()) {
      json[key] = value;
    }

    document.getElementById('winkelwagen-submit-holder').getElementsByTagName('input')[0].remove();
    document.getElementById('winkelwagen-submit-holder').insertAdjacentHTML('beforeend', '<progress class="progress is-small is-primary" max="100">15%</progress>');
    
    [...e.target.getElementsByTagName('input')].forEach(tag => {
        tag.setAttribute('disabled', 'disabled');
    });
    [...e.target.getElementsByTagName('textarea')].forEach(tag => {
        tag.setAttribute('disabled', 'disabled');
    });
    [...e.target.getElementsByTagName('select')].forEach(tag => {
      tag.setAttribute('disabled', 'disabled');
    });
    [...document.getElementById('producten-houder').getElementsByTagName('button')].forEach(tag => {
      tag.setAttribute('disabled', 'disabled');
    });

    cart_items.iterate(item => {
      json.items.push(item);
    }).then(() => {
      fetch('https://normalecomu6lpcai-form.functions.fnc.nl-ams.scw.cloud', {
        method: 'POST',
        body: JSON.stringify(json)
      })
      .then(r => r.json())
      .then(r => {
        if(r.ok) {
          clear('Bestelling is in orde!');
        } else {
          console.error.log(r)
        }
      })
    })
  })
});

function printItems(items) {
  const producten_houder = document.getElementById('producten-houder');
  producten_houder.innerHTML = '';

  items.forEach(item => {
    if (item.hasOwnProperty('obj')) {
      item = item.obj
    }

    if (item['Track stock'] === 'Y' && parseFloat(item['In stock [NORMAL.eco]']) >= 1 && !isNaN(parseFloat(item['Price [NORMAL.eco]']))) {
      let sold_by_weight_txt = '';
      if (item['Sold by weight'] === 'Y') {
        sold_by_weight_txt = ' per kg'
      }
      
      producten_houder.insertAdjacentHTML('beforeend', `<tr>
        <th class="w-75">
            ${item['Name']}
        </th>
        <td class="has-text-right">
            ${formatter.format(parseFloat(item['Price [NORMAL.eco]'])) + sold_by_weight_txt}
        </td>
        <td>
            <button class="button is-pulled-right add-to-cart" data-item="${JSON.stringify(item).replaceAll('"', "'")}" data-show="quickview" data-target="quickview-bestelling">Toevoegen</button>
        </td>
      </tr>`);
    }
  });

  bulmaQuickview.attach();
  printCartItems();
  resetCartActions();
}

function printCartItems() {
  const cart_items_holder = document.getElementById('winkelwagen-producten-houder');
  cart_items_holder.innerHTML = '';

  cart_total = 0;
  printCartTotal(cart_total);

  cart_items.iterate(item => {
    cart_total = cart_total + item['count'] *  parseFloat(item['Price [NORMAL.eco]']);
    printCartTotal(cart_total);

    let sold_by_weight_txt = '';
    if (item['Sold by weight'] === 'Y') {
      sold_by_weight_txt = 'per kg'
    }

    cart_items_holder.insertAdjacentHTML('beforeend', `<tr>
      <th>
        ${item['Name']}
      </th>
      <td>
        ${formatter.format(parseFloat(item['Price [NORMAL.eco]']))} ${sold_by_weight_txt}
      </td>
      <td>
        ${item['count']}
      </td>
      <td>
        <button class="button is-pulled-right add-to-cart" data-item="${JSON.stringify(item).replaceAll('"', "'")}">+</button>
      </td>
      <td>
        <button class="button is-pulled-right lower-in-cart" data-item="${JSON.stringify(item).replaceAll('"', "'")}">-</button>
      </td>
    </tr>`);

    resetCartActions();
  });
}

function addToCart(e) {
  const item_data = JSON.parse(e.target.dataset.item.replaceAll("'", '"'))

  cart_items.keys().then(keys => {
    if (keys.includes(item_data['Handle'])) {
      cart_items.getItem(item_data['Handle']).then(item => {
        if(item['Sold by weight'] === 'Y') {
          item['count'] = (item['count'] * 100 + 5) / 100; // per 50g
        } else {
          item['count'] = item['count'] + 1; // per stuk
        }
        cart_items.setItem(item_data['Handle'], item).then(() => { printCartItems() })
      })
    } else {
      if(item_data['Sold by weight'] === 'Y') {
        item_data['count'] = 0.05; // per 50g
      } else {
        item_data['count'] = 1; // per stuk
      }
      cart_items.setItem(item_data['Handle'], item_data).then(() => { printCartItems() })
    }
  })
}

function lowerInCart(e) {
  const item_data = JSON.parse(e.target.dataset.item.replaceAll("'", '"'))

  cart_items.keys().then(keys => {
    if (keys.includes(item_data['Handle'])) {
      cart_items.getItem(item_data['Handle']).then(item => {
        if(item['Sold by weight'] === 'Y') {
          item['count'] = (item['count'] * 100 - 5) / 100; // per 50g
        } else {
          item['count'] = item['count'] - 1; // per stuk
        }

        if (item['count'] <= 0) {
          cart_items.removeItem(item_data['Handle']).then(() => { printCartItems() })
        } else {
          cart_items.setItem(item_data['Handle'], item).then(() => { printCartItems() })
        }
      })
    }
  })
}

function resetCartActions() {
  [...document.getElementsByClassName('add-to-cart')].forEach(tag => {
    tag.removeEventListener('click', addToCart)
    tag.addEventListener('click', addToCart)
  });

  [...document.getElementsByClassName('lower-in-cart')].forEach(tag => {
    tag.removeEventListener('click', lowerInCart)
    tag.addEventListener('click', lowerInCart)
  })
}

function printCartTotal(cart_total) {
  if (cart_total <= 0) {
    document.getElementById('winkelwagen-sturen').setAttribute('disabled', 'disabled');
  } else {
    document.getElementById('winkelwagen-sturen').removeAttribute('disabled');
  }

  let levermethode = document.getElementById('winkelwagen-levermethode').value.trim();
  if (levermethode === 'thuislevering') {
    cart_total = cart_total + 3;
    document.getElementById('winkelwagen-adres-field').classList.remove('is-hidden');
  } else {
    document.getElementById('winkelwagen-adres-field').classList.add('is-hidden');
  }

  document.getElementById('winkelwagen-totaal').innerText = formatter.format(cart_total);
}

function clear(msg='') {
  cart_items.clear()
  .then(() => {
    let form = document.getElementById('winkelwagen-form');

    [...form.getElementsByTagName('input')].forEach(tag => {
      tag.removeAttribute('disabled');
    });
    [...form.getElementsByTagName('textarea')].forEach(tag => {
      tag.removeAttribute('disabled');
    });
    [...form.getElementsByTagName('select')].forEach(tag => {
      tag.removeAttribute('disabled');
    });
    [...document.getElementById('producten-houder').getElementsByTagName('button')].forEach(tag => {
      tag.removeAttribute('disabled');
    });
    form.reset();

    document.getElementById('winkelwagen-submit-holder').getElementsByTagName('progress')[0].remove();
    document.getElementById('winkelwagen-submit-holder').insertAdjacentHTML('beforeend', '<input type="submit" class="button" disabled id="winkelwagen-sturen" form="winkelwagen-form" value="Doorsturen">');
    
    printCartItems();

    alert(msg);
  })
}