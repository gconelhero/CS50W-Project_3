document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', submit_email);
  
  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function submit_email(event) {
  event.preventDefault()

  fetch('/emails' , {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
  .then(response => load_mailbox('sent'));
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  const view = document.querySelector('#emails-view');
  view.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch('/emails/' + mailbox).then(response => response.json()).then(emails => {
    emails.forEach(email => {
      let div = document.createElement('div');      
      if (!email['read'] ) {
        div.style.backgroundColor = "#fff";
      }else{
        div.style.backgroundColor = "#f1f1f1";
      }
      if (mailbox === 'sent') {
        div.style.backgroundColor = "#fff";
      }
      
      div.innerHTML = `
        <table class="table">
          <tbody>
            <tr>
              <a><td class="col-md-4"><b>${email['sender']}</b></td></a>
              <td class="col-md-4">${email['subject']}</td>
              <td>${email['timestamp']}</td>
            </tr>
          </tbody>
        </table>
        `;
        
        div.addEventListener('click', () => load_email(email['id']));
        view.appendChild(div);
    });
  })
};

function load_email(id) {
  fetch('/emails/' + id)
  .then(response => response.json())
  .then(email => {
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'block';

    const view = document.querySelector('#email-view');
    view.innerHTML = `
      <ul class="list-group">
        <li><b>From:</b> <span>${email['sender']}</span></li>
        <li><b>To: </b><span>${email['recipients']}</span></li>
        <li><b>Subject:</b> <span>${email['subject']}</span</li>
        <li><b>Time:</b> <span>${email['timestamp']}</span></li>
      </ul>
      <hr>
      <p class="m-2">${email['body']}</p>
    `;
    const reply = document.createElement('button');
    reply.className = "btn btn-sm btn-outline-primary";
    reply.innerHTML = "Reply";
    reply.addEventListener('click', function() {
      compose_email();

      document.querySelector('#compose-recipients').value = email['sender'];
      let subject = email['subject'];
      if (subject.split(" ", 1)[0] != "Re:") {
        subject = "Re: " + subject;
      }
      document.querySelector('#compose-subject').value = subject;


      document.querySelector('#compose-body').value = `On ${email['timestamp']} ${email['sender']} wrote: ${email['body']}`;

    });

    view.appendChild(reply);

    archiveBtn = document.createElement('button');
    archiveBtn.className = "btn btn-sm btn-outline-primary";
    archiveBtn.innerHTML = !email['archived'] ? 'Archive' : 'Unarchive';
    archiveBtn.addEventListener('click', function() {
      fetch('/emails/' + email['id'], {
        method: 'PUT',
        body: JSON.stringify({ archived : !email['archived'] })
      })
      .then(response => load_mailbox('inbox'))
    });

    unreadBtn = document.createElement('button');
    unreadBtn.className = "btn btn-sm btn-outline-primary";
    unreadBtn.innerHTML = "Mark as Unread"
    unreadBtn.addEventListener('click', function() {
      fetch('/emails/' + email['id'], {
        method: 'PUT',
        body: JSON.stringify({ read : false })
      })
      .then(response => load_mailbox('inbox'))
    })
    
    if (email['sender'] !== user) {
      view.appendChild(unreadBtn);
      view.appendChild(archiveBtn);     
    }

    if (!email['read']) {
      fetch('/emails/' + email['id'], {
        method: 'PUT',
        body: JSON.stringify({ read : true })
      })
    }
  });
}