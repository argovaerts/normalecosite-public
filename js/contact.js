document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('contact-form').addEventListener('submit', e => {
        e.preventDefault();

        let fd = new FormData(e.target);
        let json = {form: 'contact'};
        for (let [key, value] of fd.entries()) {
            json[key] = value;
        }

        document.getElementById('contact-submit-holder').innerHTML = '<progress class="progress is-small is-primary" max="100">15%</progress>';
        [...e.target.getElementsByTagName('input')].forEach(tag => {
            tag.setAttribute('disabled', 'disabled');
        });
        [...e.target.getElementsByTagName('textarea')].forEach(tag => {
            tag.setAttribute('disabled', 'disabled');
        });

        fetch('https://normalecomu6lpcai-form.functions.fnc.nl-ams.scw.cloud', {
            method: 'POST',
            body: JSON.stringify(json)
        })
        .then(r => r.json())
        .then(r => {
            if(r.ok) {
                alert('We hebben je mailtje goed ontvangen.');
                document.getElementById('contact-submit-holder').innerHTML = '<input class="button" type="submit" value="Verzenden">';
                [...e.target.getElementsByTagName('input')].forEach(tag => {
                    tag.removeAttribute('disabled');
                });
                [...e.target.getElementsByTagName('textarea')].forEach(tag => {
                    tag.removeAttribute('disabled');
                })
                document.getElementById('contact-form').reset();
            } else {
                console.error.log(r)
            }
        })
    });
});